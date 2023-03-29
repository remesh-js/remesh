import { RemeshCommand, RemeshEvent, RemeshQuery, RemeshState, RemeshStore } from '../src'

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

  it('supoort calling command when Event emitted', () => {
    const OddEvent = RemeshEvent<string>({
      name: 'OddEvent',
    })

    const EvenEvent = RemeshEvent<string>({
      name: 'EvenEvent',
    })

    const CountState = RemeshState({
      name: 'CountState',
      default: 0,
    })

    const CountQuery = RemeshQuery({
      name: 'TestQuery',
      impl: ({ get }) => {
        return get(CountState())
      },
    })

    const SetCountCommand = RemeshCommand({
      name: 'SetCountCommand',
      impl: ({ get }, value: number) => {
        if (value % 2 === 0) {
          return [CountState().new(value), EvenEvent(`count is even: ${value}`)]
        }
        return [CountState().new(value), OddEvent(`count is odd: ${value}`)]
      },
    })

    const HistoryState = RemeshState({
      name: 'HistoryState',
      default: [] as string[],
    })

    const HistoryQuery = RemeshQuery({
      name: 'HistoryQuery',
      impl: ({ get }) => {
        return get(HistoryState())
      },
    })

    const AddHistoryCommand = RemeshCommand({
      name: 'AddHistoryCommand',
      impl: ({ get }, message: string) => {
        const history = get(HistoryState())
        return HistoryState().new([...history, message])
      },
    })

    SetCountCommand.before(() => {
      return AddHistoryCommand(`SetCountCommand`)
    })

    EvenEvent.emitted(({}, message) => {
      return AddHistoryCommand(message)
    })

    OddEvent.emitted(({}, message) => {
      return AddHistoryCommand(message)
    })

    const store = RemeshStore()

    store.send(SetCountCommand(0))
    store.send(SetCountCommand(1))
    store.send(SetCountCommand(2))
    store.send(SetCountCommand(3))
    store.send(SetCountCommand(4))

    expect(store.query(CountQuery())).toBe(4)
    expect(store.query(HistoryQuery())).toEqual([
      'SetCountCommand',
      'count is even: 0',
      'SetCountCommand',
      'count is odd: 1',
      'SetCountCommand',
      'count is even: 2',
      'SetCountCommand',
      'count is odd: 3',
      'SetCountCommand',
      'count is even: 4',
    ])
  })
})
