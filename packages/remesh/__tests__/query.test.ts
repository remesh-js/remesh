import { RemeshState, RemeshStore, RemeshCommand, DefaultDomain, RemeshEvent } from '../src'
import { RemeshQuery } from '../src'
import * as utils from './utils'

let store: RemeshStore

beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('query', () => {
  it('use RemeshQuery to compute derived state and store.subscribeQuery to subscribe to changes', () => {
    const AState = RemeshState({
      name: 'AState',
      default: 1,
    })

    const BState = RemeshState({
      name: 'BState',
      default: 2,
    })

    const CQuery = RemeshQuery({
      name: 'CQuery',
      impl({ get }) {
        return get(AState()) + get(BState())
      },
    })

    expect(store.query(CQuery())).toBe(3)

    const UpdateACommand = RemeshCommand({
      name: 'UpdateACommand',
      impl({}, a: number) {
        return AState().new(a)
      },
    })

    const changed = jest.fn()
    const subscription = store.subscribeQuery(CQuery(), changed)
    store.send(UpdateACommand(2))
    expect(changed).toHaveBeenLastCalledWith(4)

    store.send(UpdateACommand(3))
    expect(changed).toHaveBeenLastCalledWith(5)

    subscription.unsubscribe()
    store.send(UpdateACommand(4))
    expect(changed).toHaveBeenLastCalledWith(5)
    expect(store.query(CQuery())).toBe(6)
  })

  it('use args to query state', () => {
    type Swimming = { type: 'swimming'; name: string }
    type Jumping = { type: 'jumping'; name: string }
    type Sport = Swimming | Jumping

    const swimmingSports: Swimming[] = [
      { name: 'freestyle', type: 'swimming' },
      { name: 'breaststroke', type: 'swimming' },
    ]

    const jumpingSports: Jumping[] = [
      { name: 'high jump', type: 'jumping' },
      { name: 'pole vault', type: 'jumping' },
    ]

    const sports = [...swimmingSports, ...jumpingSports]

    const SportsState = RemeshState<Sport[]>({
      name: 'SportsState',
      default: sports,
    })

    const SportsQuery = RemeshQuery({
      name: 'SportsQuery',
      impl({ get }, type?: Sport['type']) {
        return type ? get(SportsState()).filter((sport) => sport.type === type) : get(SportsState())
      },
    })

    expect(store.query(SportsQuery())).toEqual(sports)
    expect(store.query(SportsQuery('swimming'))).toEqual(swimmingSports)
    expect(store.query(SportsQuery('jumping'))).toEqual(jumpingSports)
  })

  it('declare custom comparator using options.compare', () => {
    const NestedState = RemeshState({
      name: 'NestedState',
      default: { bar: { foo: 1 } },
    })

    const NestedQuery = RemeshQuery({
      name: 'NestedQuery',
      impl({ get }) {
        return get(NestedState())
      },
      compare(a, b) {
        return JSON.stringify(a) === JSON.stringify(b)
      },
    })

    const UpdateNestedStateCommand = RemeshCommand({
      name: 'UpdateNestedStateCommand',
      impl({}) {
        return NestedState().new({ bar: { foo: 1 } })
      },
    })

    const a = store.query(NestedQuery())
    store.send(UpdateNestedStateCommand())
    const b = store.query(NestedQuery())

    expect(a).toBe(b)
  })

  it('the owner domain of RemeshQuery is DefaultDomain', () => {
    const NameQuery = RemeshQuery({
      name: 'NameQuery',
      impl() {
        return 'remesh'
      },
    })

    expect(NameQuery.owner).toBe(DefaultDomain())
  })

  it('async query for fetch data', async () => {
    const getFeatures = (frameworkName: string): Promise<string[]> =>
      utils.delay(1000).then(() => {
        if (frameworkName === 'remesh') {
          return ['ddd', 'cqrs', 'event-driven']
        }
        if (frameworkName === 'react') {
          return ['declarative', 'component-based', 'state-driven']
        }

        throw new Error('framework does not exist')
      })

    const FrameworkNameState = RemeshState({
      name: 'FrameworkNameState',
      default: '',
    })

    const UpdateFrameworkNameCommand = RemeshCommand({
      name: 'UpdateFrameworkNameCommand',
      impl({}, frameworkName: string) {
        return FrameworkNameState().new(frameworkName)
      },
    })

    const FrameworkFeaturesQuery = RemeshQuery({
      name: 'FrameworkFeaturesQuery',
      impl: async ({ get }) => {
        const data = await getFeatures(get(FrameworkNameState()))
        return data
      },
    })

    jest.useFakeTimers()

    let promise = store.query(FrameworkFeaturesQuery())
    jest.runOnlyPendingTimers()
    await expect(promise).rejects.toThrow('framework does not exist')

    store.send(UpdateFrameworkNameCommand('react'))
    promise = store.query(FrameworkFeaturesQuery())
    jest.runOnlyPendingTimers()
    await expect(promise).resolves.toStrictEqual(['declarative', 'component-based', 'state-driven'])

    store.send(UpdateFrameworkNameCommand('remesh'))
    promise = store.query(FrameworkFeaturesQuery())
    jest.runOnlyPendingTimers()
    await expect(promise).resolves.toStrictEqual(['ddd', 'cqrs', 'event-driven'])
  })

  it('call command/event when query value changed', () => {
    const AState = RemeshState({
      name: 'AState',
      default: 0,
    })

    const BState = RemeshState({
      name: 'BState',
      default: '',
    })

    const AEvent = RemeshEvent<number>({
      name: 'AEvent',
    })

    const BEvent = RemeshEvent<string>({
      name: 'BEvent',
    })

    const SetAStateCommand = RemeshCommand({
      name: 'SetAStateCommand',
      impl: ({}, value: number) => {
        return [AState().new(value), AEvent(value)]
      },
    })

    const SetBStateCommand = RemeshCommand({
      name: 'SetBStateCommand',
      impl: ({}, value: string) => {
        return [BState().new(value), BEvent(value)]
      },
    })

    const AQuery = RemeshQuery({
      name: 'AQuery',
      impl: ({ get }) => {
        return get(AState())
      },
    })

    const BQuery = RemeshQuery({
      name: 'BQuery',
      impl: ({ get }) => {
        return get(BState())
      },
    })

    AQuery.changed(({}, { current, previous }) => {
      return SetBStateCommand(`current:${current.toString()}, previous: ${previous}`)
    })

    const CEvent = RemeshEvent<string>({
      name: 'CEvent',
    })

    BQuery.changed(({}, { current, previous }) => {
      return CEvent(current)
    })

    const fn0 = jest.fn()
    const fn1 = jest.fn()
    const fn2 = jest.fn()

    const store = RemeshStore()

    store.subscribeEvent(AEvent, fn0)
    store.subscribeEvent(BEvent, fn1)
    store.subscribeEvent(CEvent, fn2)

    expect(store.query(AQuery())).toBe(0)
    expect(store.query(BQuery())).toBe(``)

    store.send(SetAStateCommand(1))

    expect(store.query(AQuery())).toBe(1)
    expect(store.query(BQuery())).toBe(`current:1, previous: 0`)

    expect(fn0).lastCalledWith(1)
    expect(fn1).lastCalledWith(`current:1, previous: 0`)
    expect(fn2).lastCalledWith(`current:1, previous: 0`)

    store.send(SetAStateCommand(10))

    expect(store.query(AQuery())).toBe(10)
    expect(store.query(BQuery())).toBe(`current:10, previous: 1`)

    expect(fn0).lastCalledWith(10)
    expect(fn1).lastCalledWith(`current:10, previous: 1`)
    expect(fn2).lastCalledWith(`current:10, previous: 1`)
  })
})
