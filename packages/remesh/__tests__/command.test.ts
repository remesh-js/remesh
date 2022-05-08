import {
  DefaultDomain,
  RemeshCommand,
  RemeshCommand$,
  RemeshDefaultState,
  RemeshDomain,
  RemeshEvent,
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
  it('use RemeshCommand + store.sendCommand to drive update state', () => {
    const NameState = RemeshDefaultState({
      name: 'NameState',
      default: 'remesh',
    })

    expect(store.query(NameState.query())).toBe('remesh')

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl() {
        return NameState().new('ddd')
      },
    })

    store.sendCommand(NameChangeCommand())

    expect(store.query(NameState.query())).toBe('ddd')
  })

  it('get state with RemeshCommandContext.get, and can receive data with the second arg', () => {
    const NameState = RemeshDefaultState({
      name: 'NameState',
      default: 'remesh',
    })

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ get }, hi: string) {
        return NameState().new(`${hi},${get(NameState())}`)
      },
    })

    store.sendCommand(NameChangeCommand('hello'))

    expect(store.query(NameState.query())).toBe('hello,remesh')
  })

  it('can return an array to output multiple values, can contain any RemeshCommandPayload，RemeshEventPayload，RemeshStateSetterPayload，RemeshCommand$Payload', () => {
    const NameState = RemeshDefaultState({
      name: 'NameState',
      default: 'remesh',
    })

    const AgeState = RemeshDefaultState({
      name: 'AgeState',
      default: 0,
    })

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

    const NameChangeEvent = RemeshEvent({
      name: 'NameChangeEvent',
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
    expect(store.query(AgeState.query())).toBe(1)
    const ageChanged = jest.fn()
    store.subscribeQuery(AgeState.query(), ageChanged)
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

        const RankingUpdateCommand = domain.command({
          name: 'RankingUpdateCommand',
          impl(_, ranking: number) {
            return RankingState().new(ranking)
          },
        })

        domain.ignite(() => RankingUpdateCommand(99))

        return { query: { RankingQuery: RankingState.query }, command: { RankingUpdate: RankingUpdateCommand } }
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

    const fetchFeaturesCommand$ = RemeshCommand$({
      name: 'fetchFeaturesCommand$',
      impl(_, payload$: Observable<void>) {
        return payload$.pipe(
          switchMap(() => getFeatures()),
          map((features) => FeaturesState().new(features)),
        )
      },
    })

    expect(fetchFeaturesCommand$.owner).toBe(DefaultDomain())

    jest.useFakeTimers()
    const changed = jest.fn()
    store.subscribeQuery(FeaturesState.query(), changed)
    store.sendCommand(fetchFeaturesCommand$())
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

    const fromEventToUpdate$ = RemeshCommand$({
      name: 'fromEventToUpdate',
      impl({ fromEvent, get }) {
        return fromEvent(CountIncreaseEvent)
          .pipe(map(() => get(CountState()) + 1))
          .pipe(map((count) => UpdateCountCommand(count)))
      },
    })

    const fromQueryToEvent$ = RemeshCommand$({
      name: 'fromQueryToEvent',
      impl({ fromQuery }) {
        return fromQuery(CountState.query()).pipe(map((count) => CountChangedEvent(count)))
      },
    })

    const changed = jest.fn()
    store.sendCommand(fromEventToUpdate$())
    store.sendCommand(fromQueryToEvent$())

    store.subscribeEvent(CountChangedEvent, changed)
    store.emitEvent(CountIncreaseEvent())

    expect(changed).toHaveBeenCalledWith(1)
    expect(store.query(CountState.query())).toBe(1)
  })
})
