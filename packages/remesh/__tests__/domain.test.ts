import { RemeshDomain, RemeshStore } from '../src'
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

        const CountCommand = domain.command({
          name: 'CountCommand',
          impl: ({}, count: number) => {
            return [CountState().new(count), CountEvent(count)]
          },
        })

        const CountEvent = domain.event<number>({
          name: 'CountEvent',
        })

        return { query: { CountQuery }, command: { CountCommand }, event: { CountEvent } }
      },
    })

    const counter = store.getDomain(CounterDomain())

    const eventCallback = jest.fn()
    const queryCallback = jest.fn()

    store.subscribeEvent(counter.event.CountEvent, eventCallback)
    store.subscribeQuery(counter.query.CountQuery(), queryCallback)

    expect(store.query(counter.query.CountQuery())).toBe(0)

    store.send(counter.command.CountCommand(1))

    expect(store.query(counter.query.CountQuery())).toBe(1)
    expect(eventCallback).toHaveBeenCalledWith(1)
    expect(queryCallback).toHaveBeenCalledWith(1)

    store.send(counter.command.CountCommand(2))

    expect(store.query(counter.query.CountQuery())).toBe(2)
    expect(eventCallback).toHaveBeenCalledWith(2)
    expect(queryCallback).toHaveBeenCalledWith(2)
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
          default: 'ddd',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return [get(ContentState()), { UpdateContentCommand }] as const
          },
        })

        const ContentChangeEvent = domain.event({
          name: 'ContentChangeEvent',
        })

        const UpdateContentCommand = domain.command({
          name: 'UpdateContentCommand',
          impl({}, newContent: string) {
            return [ContentState().new(newContent), ContentChangeEvent()]
          },
        })

        return {
          query: {
            ContentQuery,
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
            const [content] = get(inputDomain.query.ContentQuery())
            return `content: ${content}`
          },
        })

        return {
          query: {
            ContentQuery: inputDomain.query.ContentQuery,
            DisplayContentQuery,
          },
          event: inputDomain.event,
        }
      },
    })

    const store = RemeshStore({
      name: 'store',
    })

    const contentDomain = store.getDomain(ContentDomain())

    await utils.delay(100)
    expect(store.query(contentDomain.query.DisplayContentQuery())).toBe('content: ddd')

    const changed = jest.fn()

    const [, commands] = store.query(contentDomain.query.ContentQuery())

    store.subscribeEvent(contentDomain.event.ContentChangeEvent, changed)
    store.send(commands.UpdateContentCommand('remesh'))

    expect(store.query(contentDomain.query.DisplayContentQuery())).toBe('content: remesh')
    expect(changed).toHaveBeenCalled()
  })
})
