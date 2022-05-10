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
import { delay, Observable, switchMap } from 'rxjs'
import { map } from 'rxjs/operators'
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
      impl() {
        return NameState().new('ddd')
      },
    })

    store.sendCommand(NameChangeCommand())

    expect(store.query(NameQuery())).toBe('ddd')
  })

  it('get state with RemeshCommandContext.get, and can receive data with the second arg', () => {
    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ get }, hi: string) {
        return NameState().new(`${hi},${get(NameState())}`)
      },
    })

    store.sendCommand(NameChangeCommand('hello'))

    expect(store.query(NameQuery())).toBe('hello,remesh')
  })

  it('can return an array to output multiple values, can contain any RemeshCommandPayload，RemeshEventPayload，RemeshStateSetterPayload，RemeshCommand$Payload', () => {
    const UpdateAgeCommand = RemeshCommand({
      name: 'UpdateAgeCommand',
      impl(_, age: number) {
        return AgeState().new(age)
      },
    })

    const TimerUpdateAgeCommand$ = RemeshCommand$({
      name: 'TimerUpdateAgeCommand$',
      impl({ get }, payload$) {
        return payload$.pipe(
          delay(2000),
          map(() => UpdateAgeCommand(get(AgeState()) + 1)),
        )
      },
    })

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl() {
        return [NameState().new('ddd'), NameChangeEvent(), UpdateAgeCommand(1), TimerUpdateAgeCommand$()]
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
          impl(_, ranking: number) {
            return RankingState().new(ranking)
          },
        })

        domain.ignite(() => RankingUpdateCommand(99))

        return { query: { RankingQuery: RankingQuery }, command: { RankingUpdateCommand: RankingUpdateCommand } }
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

    const FetchFeaturesCommand$ = RemeshCommand$({
      name: 'FetchFeaturesCommand$',
      impl(_, payload$: Observable<void>) {
        return payload$.pipe(
          switchMap(() => getFeatures()),
          map((features) => FeaturesState().new(features)),
        )
      },
    })

    expect(FetchFeaturesCommand$.owner).toBe(DefaultDomain())

    jest.useFakeTimers()
    const changed = jest.fn()
    store.subscribeQuery(FeaturesQuery(), changed)
    store.sendCommand(FetchFeaturesCommand$())
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
      impl(_, count: number) {
        return CountState().new(count)
      },
    })

    const CountChangedEvent = RemeshEvent<number>({
      name: 'CountChangedEvent',
    })

    const CountIncreaseEvent = RemeshEvent({
      name: 'CountIncreaseEvent',
    })

    const FromEventToUpdateCommand$ = RemeshCommand$({
      name: 'FromEventToUpdateCommand$',
      impl({ fromEvent, get }) {
        return fromEvent(CountIncreaseEvent)
          .pipe(map(() => get(CountState()) + 1))
          .pipe(map((count) => UpdateCountCommand(count)))
      },
    })

    const FromQueryToEventCommand$ = RemeshCommand$({
      name: 'FromQueryToEventCommand$',
      impl({ fromQuery }) {
        return fromQuery(CountQuery()).pipe(map((count) => CountChangedEvent(count)))
      },
    })

    const changed = jest.fn()
    store.sendCommand(FromEventToUpdateCommand$())
    store.sendCommand(FromQueryToEventCommand$())

    store.subscribeEvent(CountChangedEvent, changed)
    store.emitEvent(CountIncreaseEvent())

    expect(changed).toHaveBeenCalledWith(1)
    expect(store.query(CountQuery())).toBe(1)
  })
})
