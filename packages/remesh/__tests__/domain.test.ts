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

        return { query: { count: CountState.query } }
      },
    })

    const counter = store.getDomain(CounterDomain())

    expect(store.query(counter.query.count())).toBe(0)
  })

  it('multi-domain with a store', () => {
    const BarDomain = RemeshDomain({
      name: 'BarDomain',
      impl(domain) {
        const ContentState = domain.state({ name: 'content', default: 'bar' })
        return { query: { content: ContentState.query } }
      },
    })

    const FooDomain = RemeshDomain({
      name: 'BarDomain',
      impl(domain) {
        const ContentState = domain.state({ name: 'content', default: 'foo' })
        return { query: { content: ContentState.query } }
      },
    })

    const barDomain = store.getDomain(BarDomain())
    const fooDomain = store.getDomain(FooDomain())

    expect(store.query(barDomain.query.content())).toBe('bar')
    expect(store.query(fooDomain.query.content())).toBe('foo')
  })

  it('use another domain in domain', async () => {
    const InputDomain = RemeshDomain({
      name: 'InputDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: '',
        })

        const ContentChangeEvent = domain.event({ name: 'ContentChangeEvent' })

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
            content: ContentState.query,
          },
          command: {
            updateContent: UpdateContentCommand,
          },
          event: {
            ContentChangeEvent,
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
            return `content: ${get(inputDomain.query.content())}`
          },
        })

        return {
          query: {
            content: inputDomain.query.content,
            displayContent: DisplayContentQuery,
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
    expect(store.query(contentDomain.query.displayContent())).toBe('content: ddd')

    const changed = jest.fn()
    store.subscribeEvent(contentDomain.event.ContentChangeEvent, changed)

    contentDomain.command.updateContent('remesh')
    expect(store.query(contentDomain.query.displayContent())).toBe('content: remesh')
    expect(changed).toHaveBeenCalled()
  })
})
