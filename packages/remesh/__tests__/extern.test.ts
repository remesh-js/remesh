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
          impl({ get }, arg$) {
            return arg$.pipe(map(() => get(CountState())))
          },
        })

        const UpdateCounterCommand = domain.command({
          name: 'UpdateCounterCommand',
          impl({ set, emit }, value: number) {
            set(CountState(), value)
            emit(UpdateCounterEvent())
          },
        })

        const FromStateToStorageEvent = domain.event({
          name: 'FromStateToStorageEvent',
          impl({ fromEvent }) {
            return fromEvent(UpdateCounterEvent).pipe(
              tap((value) => {
                const storage = domain.getExtern(StorageExtern)
                storage.set('counter', value)
              }),
            )
          },
        })

        return {
          query: { CountQuery },
          command: {
            UpdateCounterCommand,
          },
          event: { UpdateCounterEvent, FromStateToStorageEvent },
        }
      },
    })

    const store1 = RemeshStore({
      name: 'store',
    })

    const counter = store1.getDomain(CounterDomain())

    const changed = jest.fn()

    store1.subscribeEvent(counter.event.UpdateCounterEvent, changed)

    store1.emitEvent(counter.event.FromStateToStorageEvent())
    counter.command.UpdateCounterCommand(1)

    expect(changed).toBeCalled()
    expect(store1.query(counter.query.CountQuery())).toBe(memoryCache.get('counter'))
  })
})
