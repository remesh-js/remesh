import { RemeshCommand, RemeshEvent, RemeshState, RemeshStore } from '../src'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

describe('event', () => {
  it('define an event and use command to trigger it', () => {
    const CountState = RemeshState({
      name: 'CountState',
      default: 0,
    })

    const CounterChangedEvent = RemeshEvent({
      name: 'CounterChangedEvent',
    })

    const IncreaseCounterCommand = RemeshCommand({
      name: 'IncreaseCounterCommand',
      impl({ get }) {
        return [CountState().new(get(CountState()) + 1), CounterChangedEvent()]
      },
    })

    const changed = jest.fn()
    const subscription = store.subscribeEvent(CounterChangedEvent, changed)

    store.send(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledTimes(1)

    store.send(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledTimes(2)

    subscription.unsubscribe()
    store.send(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledTimes(2)
  })

  it('use options.impl to mapping more information', () => {
    const CountState = RemeshState({
      name: 'CountState',
      default: 0,
    })

    const CounterChangedEvent = RemeshEvent({
      name: 'CounterChangedEvent',
      impl({ get }, from: string) {
        return {
          from,
          count: get(CountState()),
        }
      },
    })

    const IncreaseCounterCommand = RemeshCommand({
      name: 'IncreaseCounterCommand',
      impl({ get }) {
        return [CountState().new(get(CountState()) + 1), CounterChangedEvent('IncreaseCounterCommand')]
      },
    })

    const changed = jest.fn()
    store.subscribeEvent(CounterChangedEvent, changed)
    store.send(IncreaseCounterCommand())
    expect(changed).toHaveBeenCalledWith({ count: 1, from: 'IncreaseCounterCommand' })
  })

  it('support SubscribeOnlyEvent', () => {
    const TestEvent = RemeshEvent<number>({
      name: 'TestEvent',
    })

    const changed = jest.fn()

    const SubscribeOnlyTestEvent = TestEvent.toSubscribeOnlyEvent()

    const store = RemeshStore()

    store.subscribeEvent(SubscribeOnlyTestEvent, changed)

    store.send(TestEvent(1))

    expect(changed).toHaveBeenCalledWith(1)
  })
})
