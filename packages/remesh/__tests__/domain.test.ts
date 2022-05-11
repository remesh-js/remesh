import { RemeshDomain, RemeshStore } from '../src'
import { switchMap } from 'rxjs'
import * as utils from './utils'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

describe('domain', () => {
  it('basic - use RemeshDomain to define a domain', () => {
    const CounterDomain = RemeshDomain({
      name: 'CounterDomain',
      impl(domain) {
        const CountState = domain.state({
          name: 'CountState',
          default: 0,
        })

        const CountQuery = domain.query({
          name: 'CountQuery',
          impl: ({ get }) => {
            return get(CountState())
          },
        })

        return { query: { CountQuery } }
      },
    })

    const counter = store.getDomain(CounterDomain())

    expect(store.query(counter.query.CountQuery())).toBe(0)
  })

  it('multi-domain with a store', () => {
    const BarDomain = RemeshDomain({
      name: 'BarDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: 'bar',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return get(ContentState())
          },
        })

        return { query: { ContentQuery } }
      },
    })

    const FooDomain = RemeshDomain({
      name: 'BarDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: 'foo',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return get(ContentState())
          },
        })

        return { query: { ContentQuery } }
      },
    })

    const barDomain = store.getDomain(BarDomain())
    const fooDomain = store.getDomain(FooDomain())

    expect(store.query(barDomain.query.ContentQuery())).toBe('bar')
    expect(store.query(fooDomain.query.ContentQuery())).toBe('foo')
  })

  it('use another domain in domain', async () => {
    const InputDomain = RemeshDomain({
      name: 'InputDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: '',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return get(ContentState())
          },
        })

        const ContentChangeEvent = domain.event({
          name: 'ContentChangeEvent',
        })

        const UpdateContentCommand = domain.command({
          name: 'UpdateContentCommand',
          impl(_, newContent: string) {
            return [ContentState().new(newContent), ContentChangeEvent()]
          },
        })

        const RemoteContentCommand$ = domain.command$({
          name: 'RemoteContentCommand$',
          impl(_, payload$) {
            return payload$.pipe(switchMap(() => utils.delay(1).then(() => ContentState().new('ddd'))))
          },
        })

        domain.ignite(() => RemoteContentCommand$())

        return {
          query: {
            ContentQuery
          },
          command: {
            UpdateContentCommand
          },
          event: {
            ContentChangeEvent
          },
        }
      },
    })

    const ContentDomain = RemeshDomain({
      name: 'ContentDomain',
      impl(domain) {
        const inputDomain = domain.getDomain(InputDomain())

        const DisplayContentQuery = domain.query({
          name: 'DisplayContentQuery',
          impl({ get }) {
            return `content: ${get(inputDomain.query.ContentQuery())}`
          },
        })

        return {
          query: {
            ContentQuery: inputDomain.query.ContentQuery,
            DisplayContentQuery
          },
          command: inputDomain.command,
          event: inputDomain.event,
        }
      },
    })

    const store = RemeshStore({
      name: 'store',
    })

    const contentDomain = store.getDomain(ContentDomain())
    store.subscribeDomain(ContentDomain())

    await utils.delay(100)
    expect(store.query(contentDomain.query.DisplayContentQuery())).toBe('content: ddd')

    const changed = jest.fn()

    store.subscribeEvent(contentDomain.event.ContentChangeEvent, changed)

    contentDomain.command.UpdateContentCommand('remesh')

    expect(store.query(contentDomain.query.DisplayContentQuery())).toBe('content: remesh')
    expect(changed).toHaveBeenCalled()
  })
})
