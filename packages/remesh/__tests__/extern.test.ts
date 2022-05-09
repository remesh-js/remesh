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

        const CountQuery = domain.query({
          name: 'CountQuery',
          impl: ({ get }) => {
            return get(CountState())
          },
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

        const FromStateToStorageCommand$ = domain.command$({
          name: 'FromStateToStorageCommand$',
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
          command: {
            UpdateCounterCommand: UpdateCounterCommand,
            FromStateToStorageCommand$: FromStateToStorageCommand$,
          },
          event: { UpdateCounterEvent },
        }
      },
    })

    const store1 = RemeshStore({
      name: 'store',
    })

    const counter = store1.getDomain(CounterDomain())

    counter.command.FromStateToStorageCommand$()
    counter.command.UpdateCounterCommand(1)

    expect(store1.query(counter.query.CountQuery())).toBe(memoryCache.get('counter'))
  })
})
