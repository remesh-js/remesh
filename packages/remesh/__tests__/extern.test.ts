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
          default: (storage.get('counter') as number) ?? 0,
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
          impl({ set, emit }, value: number) {
            set(CountState(), value)
            emit(UpdateCounterEvent())
          },
        })

        const FromStateToStorageCommand = domain.command$({
          name: 'FromStateToStorageCommand',
          impl({ fromEvent }) {
            return fromEvent(UpdateCounterEvent).pipe(
              tap((value) => {
                const storage = domain.getExtern(StorageExtern)
                storage.set('counter', value)
              }),
            )
          },
        })

        domain.ignite(({ send }) => {
          return send(FromStateToStorageCommand())
        })

        return {
          query: { CountQuery },
          command: {
            UpdateCounterCommand,
          },
          event: { UpdateCounterEvent },
        }
      },
    })

    const store1 = RemeshStore({
      name: 'store',
    })

    const counter = store1.getDomain(CounterDomain())

    const changed = jest.fn()

    store1.subscribeDomain(CounterDomain())

    store1.subscribeEvent(counter.event.UpdateCounterEvent, changed)
    counter.command.UpdateCounterCommand(1)

    expect(changed).toBeCalled()
    expect(store1.query(counter.query.CountQuery())).toBe(memoryCache.get('counter'))
  })
})
