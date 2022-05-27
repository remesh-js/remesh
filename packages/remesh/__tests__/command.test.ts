import {
  DefaultDomain,
  RemeshCommand,
  RemeshCommand$,
  RemeshDefaultState,
  RemeshDomain,
  RemeshEvent,
  RemeshQuery,
  RemeshStore,
} from '../src'
import { delay, Observable, switchMap, timer } from 'rxjs'
import { map, mergeMap, tap } from 'rxjs/operators'
import * as utils from './utils'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('command', () => {
  const NameState = RemeshDefaultState({
    name: 'NameState',
    default: 'remesh',
  })

  const NameQuery = RemeshQuery({
    name: 'NameQuery',
    impl: ({ get }) => {
      return get(NameState())
    },
  })

  const NameChangeEvent = RemeshEvent({
    name: 'NameChangeEvent',
  })

  const AgeState = RemeshDefaultState({
    name: 'AgeState',
    default: 0,
  })

  const AgeQuery = RemeshQuery({
    name: 'AgeQuery',
    impl: ({ get }) => {
      return get(AgeState())
    },
  })

  it('use RemeshCommand + store.sendCommand to drive update state', () => {
    expect(store.query(NameQuery())).toBe('remesh')

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ set }) {
        set(NameState(), 'ddd')
      },
    })

    store.sendCommand(NameChangeCommand())

    expect(store.query(NameQuery())).toBe('ddd')
  })

  it('get state with RemeshCommandContext.get, and can receive data with the second arg', () => {
    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ get, set }, hi: string) {
        set(NameState(), `${hi},${get(NameState())}`)
      },
    })

    store.sendCommand(NameChangeCommand('hello'))

    expect(store.query(NameQuery())).toBe('hello,remesh')
  })

  it('can set state, send command and emit event in any times', () => {
    const UpdateAgeCommand = RemeshCommand({
      name: 'UpdateAgeCommand',
      impl({ set }, age: number) {
        set(AgeState(), age)
      },
    })

    const TimerUpdateAgeCommand = RemeshCommand({
      name: 'TimerUpdateAgeCommand',
      impl({ get, send }) {
        return timer(2000).pipe(
          tap(() => {
            send(UpdateAgeCommand(get(AgeState()) + 1))
          }),
        )
      },
    })

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ set, send, emit }) {
        set(NameState(), 'ddd')
        emit(NameChangeEvent())
        send(UpdateAgeCommand(1))
        return send(TimerUpdateAgeCommand())
      },
    })

    jest.useFakeTimers()
    const changed = jest.fn()
    store.subscribeEvent(NameChangeEvent, changed)

    store.sendCommand(NameChangeCommand())

    expect(changed).toHaveBeenCalled()
    expect(store.query(AgeQuery())).toBe(1)
    const ageChanged = jest.fn()
    store.subscribeQuery(AgeQuery(), ageChanged)
    expect(ageChanged).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()
    expect(ageChanged).toHaveBeenCalledWith(2)
  })

  it('ignite', () => {
    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const RankingState = domain.state({
          name: 'RankingState',
          default: 0,
        })

        const RankingQuery = domain.query({
          name: 'RankingQuery',
          impl: ({ get }) => {
            return get(RankingState())
          },
        })

        const RankingUpdateCommand = domain.command({
          name: 'RankingUpdateCommand',
          impl({ set }, ranking: number) {
            set(RankingState(), ranking)
          },
        })

        domain.ignite(({ send }) => {
          send(RankingUpdateCommand(99))
        })

        return { query: { RankingQuery }, command: { RankingUpdateCommand } }
      },
    })

    const testDomain = store.getDomain(TestDomain())
    store.subscribeDomain(TestDomain())

    expect(store.query(testDomain.query.RankingQuery())).toBe(99)
  })
})

describe('command$', () => {
  it('basic', async () => {
    const getFeatures = () => utils.delay(1000).then(() => Promise.resolve(['ddd', 'cqrs', 'event-driven']))

    const FeaturesState = RemeshDefaultState<string[]>({
      name: 'FeaturesState',
      default: [],
    })

    const FeaturesQuery = RemeshQuery({
      name: 'FeaturesQuery',
      impl({ get }) {
        return get(FeaturesState())
      },
    })

    const FetchFeaturesEvent = RemeshEvent({
      name: 'FetchFeaturesEvent',
    })

    const FetchFeaturesCommand = RemeshCommand({
      name: 'FetchFeaturesCommand',
      impl({ set, fromEvent }) {
        return fromEvent(FetchFeaturesEvent).pipe(
          switchMap(() => getFeatures()),
          tap((features) => {
            set(FeaturesState(), features)
          }),
        )
      },
    })

    expect(FetchFeaturesCommand.owner).toBe(DefaultDomain())

    jest.useFakeTimers()
    const changed = jest.fn()
    store.subscribeQuery(FeaturesQuery(), changed)
    store.sendCommand(FetchFeaturesCommand())
    store.emitEvent(FetchFeaturesEvent())
    jest.runOnlyPendingTimers()

    jest.useRealTimers()
    await utils.delay(1)
    expect(changed).toHaveBeenCalledWith(['ddd', 'cqrs', 'event-driven'])
  })

  it('fromQuery/fromEvent', () => {
    const CountState = RemeshDefaultState({
      name: 'CountState',
      default: 0,
    })

    const CountQuery = RemeshQuery({
      name: 'CountQuery',
      impl({ get }) {
        return get(CountState())
      },
    })

    const UpdateCountCommand = RemeshCommand({
      name: 'UpdateCountCommand',
      impl({ set }, count: number) {
        set(CountState(), count)
      },
    })

    const CountChangedEvent = RemeshEvent<number>({
      name: 'CountChangedEvent',
    })

    const CountIncreaseEvent = RemeshEvent({
      name: 'CountIncreaseEvent',
    })

    const FromEventToUpdateCommand = RemeshCommand({
      name: 'FromEventToUpdateCommand',
      impl({ fromEvent, get, send }) {
        return fromEvent(CountIncreaseEvent).pipe(
          map(() => get(CountState()) + 1),
          tap((count) => {
            send(UpdateCountCommand(count))
          }),
        )
      },
    })

    const FromQueryToEventCommand = RemeshCommand({
      name: 'FromQueryToEventCommand',
      impl({ fromQuery, emit }) {
        return fromQuery(CountQuery()).pipe(
          tap((count) => {
            emit(CountChangedEvent(count))
          }),
        )
      },
    })

    const changed = jest.fn()
    store.sendCommand(FromEventToUpdateCommand())
    store.sendCommand(FromQueryToEventCommand())

    store.subscribeEvent(CountChangedEvent, changed)
    store.emitEvent(CountIncreaseEvent())

    expect(changed).toHaveBeenCalledWith(1)
    expect(store.query(CountQuery())).toBe(1)
  })

  it('support command$', () => {
    const fn0 = jest.fn()
    const fn1 = jest.fn()
    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const ACommand = domain.command$({
          name: 'ACommand',
          impl: (_, arg$: Observable<number>) => {
            fn0()
            return arg$.pipe(
              mergeMap((arg) => {
                return timer(arg)
              }),
              tap((value) => {
                fn1(value)
              }),
            )
          },
        })

        return {
          command: {
            ACommand,
          },
        }
      },
    })

    const testDomain = store.getDomain(TestDomain())
    store.subscribeDomain(TestDomain())

    // should not call command$.impl when domain is subscribed
    expect(fn0).not.toHaveBeenCalled()
    expect(fn1).not.toHaveBeenCalled()

    jest.useFakeTimers()

    testDomain.command.ACommand(1)

    // should call command$.impl when command was sended
    expect(fn0).toHaveBeenCalled()
    expect(fn1).not.toHaveBeenCalled()

    jest.runOnlyPendingTimers()

    expect(fn1).toHaveBeenCalledWith(0)
  })
})
