import { map, Observable } from 'rxjs'
import { RemeshCommand, RemeshDefaultState, RemeshEvent, RemeshStore } from '../src'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

describe('event', () => {
  it('define an event and use command to trigger it', () => {
    const CountState = RemeshDefaultState({
      name: 'CountState',
      default: 0,
    })
    const CounterChangedEvent = RemeshEvent({
      name: 'CounterChangedEvent',
    })

    const IncreaseCounterCommand = RemeshCommand({
      name: 'IncreaseCounterCommand',
      impl({ get, set, emit }) {
        set(CountState(), get(CountState()) + 1)
        emit(CounterChangedEvent())
      },
    })

    const changed = jest.fn()
    const subscription = store.subscribeEvent(CounterChangedEvent, changed)

    store.sendCommand(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledTimes(1)

    store.sendCommand(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledTimes(2)

    subscription.unsubscribe()
    store.sendCommand(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledTimes(2)
  })

  it('use options.impl to mapping more information', () => {
    const CountState = RemeshDefaultState({
      name: 'CountState',
      default: 0,
    })

    const CounterChangedEvent = RemeshEvent({
      name: 'CounterChangedEvent',
      impl({ get }, from$: Observable<string>) {
        return from$.pipe(
          map((from) => {
            return {
              from,
              count: get(CountState()),
            }
          }),
        )
      },
    })

    const IncreaseCounterCommand = RemeshCommand({
      name: 'IncreaseCounterCommand',
      impl({ get, set, emit }) {
        set(CountState(), get(CountState()) + 1)
        emit(CounterChangedEvent('IncreaseCounterCommand'))
      },
    })

    const changed = jest.fn()
    store.subscribeEvent(CounterChangedEvent, changed)
    store.sendCommand(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledWith({ count: 1, from: 'IncreaseCounterCommand' })
  })
})
