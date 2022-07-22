import { RemeshDomain, RemeshExtern, RemeshStore } from '../src'
import { map, tap } from 'rxjs'

describe('extern', () => {
  it('define an extern and use it', () => {
    const memoryCache = (() => {
      const cache = {}
      return {
        get(key: string) {
          return cache[key]
        },
        set(key: string, value: any) {
          cache[key] = value
        },
      }
    })()

    const StorageExtern = RemeshExtern({
      default: memoryCache,
    })

    const CounterDomain = RemeshDomain({
      name: 'CounterDomain',
      impl(domain) {
        const storage = domain.getExtern(StorageExtern)

        const CountState = domain.state({
          name: 'CountState',
          default: (storage.get('counter') as number) ?? 0,
        })

        const UpdateCounterCommand = domain.command({
          name: 'UpdateCounterCommand',
          impl({}, value: number) {
            return [CountState().new(value), UpdateCounterEvent()]
          },
        })

        const CountQuery = domain.query({
          name: 'CountQuery',
          impl: ({ get }) => {
            return [get(CountState()), { UpdateCounterCommand }] as const
          },
        })

        const UpdateCounterEvent = domain.event({
          name: 'UpdateCounterEvent',
          impl({ get }) {
            return get(CountState())
          },
        })

        domain.effect({
          name: 'FromStateToStorageEffect',
          impl({ fromEvent }) {
            return fromEvent(UpdateCounterEvent).pipe(
              tap((value) => {
                const storage = domain.getExtern(StorageExtern)
                storage.set('counter', value)
              }),
              map(() => null),
            )
          },
        })

        return {
          query: { CountQuery },
          event: { UpdateCounterEvent },
        }
      },
    })

    const store = RemeshStore({
      name: 'store',
    })

    const counter = store.getDomain(CounterDomain())

    const changed = jest.fn()

    store.igniteDomain(CounterDomain())

    const [, commands] = store.query(counter.query.CountQuery())

    store.subscribeEvent(counter.event.UpdateCounterEvent, changed)
    store.send(commands.UpdateCounterCommand(1))

    expect(changed).toBeCalled()
    const [count] = store.query(counter.query.CountQuery())
    expect(count).toBe(memoryCache.get('counter'))
  })
})
