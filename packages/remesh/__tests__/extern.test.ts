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
      name: 'StorageExtern',
      default: memoryCache,
    })

    const CounterDomain = RemeshDomain({
      name: 'CounterDomain',
      impl(domain) {
        const storage = domain.getExtern(StorageExtern)
        const CountState = domain.state({
          name: 'CountState',
          default: storage.get('counter') ?? 0,
        })

        const UpdateCounterEvent = domain.event({
          name: 'UpdateCounterEvent',
          impl({ get }) {
            return get(CountState())
          },
        })

        const UpdateCounterCommand = domain.command({
          name: 'UpdateCounterCommand',
          impl({ get }, value: number) {
            return [CountState().new(get(CountState()) + value), UpdateCounterEvent()]
          },
        })

        const fromStateToStorage = domain.command$({
          name: 'fromStateToStorage',
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
          query: { CounterQuery: CountState.query },
          command: { UpdateCounter: UpdateCounterCommand, fromStateToStorage },
          event: { UpdateCounterEvent },
        }
      },
    })

    const store1 = RemeshStore({
      name: 'store',
    })

    const counter = store1.getDomain(CounterDomain())
    counter.command.fromStateToStorage()
    counter.command.UpdateCounter(1)
    expect(store1.query(counter.query.CounterQuery())).toBe(memoryCache.get('counter'))
  })
})
