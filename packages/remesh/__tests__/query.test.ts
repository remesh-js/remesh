import { RemeshDefaultState, RemeshStore, RemeshCommand, DefaultDomain } from '../src'
import { RemeshQuery } from '../src'
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

describe('query', () => {
  it('use RemeshQuery to compute derived state and store.subscribeQuery to subscribe to changes', () => {
    const AState = RemeshDefaultState({
      name: 'AState',
      default: 1,
    })

    const BState = RemeshDefaultState({
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
      impl(_, a: number) {
        return AState().new(a)
      },
    })

    const changed = jest.fn()
    const subscription = store.subscribeQuery(CQuery(), changed)
    store.sendCommand(UpdateACommand(2))
    expect(changed).toHaveBeenLastCalledWith(4)

    store.sendCommand(UpdateACommand(3))
    expect(changed).toHaveBeenLastCalledWith(5)

    subscription.unsubscribe()
    store.sendCommand(UpdateACommand(4))
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

    const SportsState = RemeshDefaultState<Sport[]>({
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
    const NestedState = RemeshDefaultState({
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
      impl() {
        return NestedState().new({ bar: { foo: 1 } })
      },
    })

    const a = store.query(NestedQuery())
    store.sendCommand(UpdateNestedStateCommand())
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

    const FrameworkNameState = RemeshDefaultState({
      name: 'FrameworkNameState',
      default: '',
    })

    const UpdateFrameworkNameCommand = RemeshCommand({
      name: 'UpdateFrameworkNameCommand',
      impl(_, frameworkName: string) {
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

    store.sendCommand(UpdateFrameworkNameCommand('react'))
    promise = store.query(FrameworkFeaturesQuery())
    jest.runOnlyPendingTimers()
    await expect(promise).resolves.toStrictEqual(['declarative', 'component-based', 'state-driven'])

    store.sendCommand(UpdateFrameworkNameCommand('remesh'))
    promise = store.query(FrameworkFeaturesQuery())
    jest.runOnlyPendingTimers()
    await expect(promise).resolves.toStrictEqual(['ddd', 'cqrs', 'event-driven'])
  })

  it('use peek to read state but not collected by dependencies', () => {
    const AState = RemeshDefaultState({
      name: 'AState',
      default: 1,
    })

    const BState = RemeshDefaultState({
      name: 'BState',
      default: 2,
    })

    const CQuery = RemeshQuery({
      name: 'CQuery',
      impl({ peek }) {
        return [peek(AState()) as number, peek(BState()) as number]
      },
    })

    const UpdateACommand = RemeshCommand({
      name: 'UpdateACommand',
      impl(_, num: number) {
        return AState().new(num)
      },
    })

    const UpdateBCommand = RemeshCommand({
      name: 'UpdateBCommand',
      impl(_, num: number) {
        return BState().new(num)
      },
    })

    const DQuery = RemeshQuery({
      name: 'DQuery',
      impl({ peek, get }) {
        return [get(AState()), peek(BState()) as number, peek(CQuery()) as number[]]
      },
    })

    expect(store.query(CQuery())).toEqual([1, 2])
    expect(store.query(DQuery())).toEqual([1, 2, [1, 2]])

    store.sendCommand(UpdateBCommand(3))
    // using peek won't update
    expect(store.query(CQuery())).toEqual([1, 2])
    // only update b, d won't update
    expect(store.query(DQuery())).toEqual([1, 2, [1, 2]])

    store.sendCommand(UpdateACommand(2))
    // using peek won't update
    expect(store.query(CQuery())).toEqual([1, 2])
    // c has cache
    expect(store.query(DQuery())).toEqual([2, 3, [1, 2]])
  })
})
