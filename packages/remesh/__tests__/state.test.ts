import {
  RemeshState,
  RemeshQuery,
  RemeshDefaultState,
  RemeshStore,
  RemeshDeferState,
  RemeshCommand,
  RemeshDomain,
  DefaultDomain,
  RemeshEvent,
  RemeshValuePlaceholder,
} from '../src'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

describe('state', () => {
  it('use RemeshState to declare state', () => {
    const NameState = RemeshState({
      name: 'NameState',
      impl: () => 'remesh',
    })

    const NameStateQuery = RemeshQuery({
      name: 'NameStateQuery',
      impl: ({ get }) => get(NameState()),
    })

    expect(store.query(NameStateQuery())).toBe('remesh')
  })

  it('use RemeshState built-in State.Query to replace RemeshQuery', () => {
    const NameState = RemeshState({
      name: 'NameState',
      impl: () => 'remesh',
    })

    expect(store.query(NameState.query())).toBe('remesh')
  })

  it('use RemeshCommand + State().new() to update state and store.subscribeQuery to subscribe to changes', () => {
    const NameState = RemeshState({
      name: 'NameState',
      impl: () => 'remesh',
    })

    expect(store.query(NameState.query())).toBe('remesh')

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl() {
        return NameState().new('ddd')
      },
    })

    const changed = jest.fn()
    store.subscribeQuery(NameState.query(), changed)

    store.sendCommand(NameChangeCommand())

    expect(changed).toHaveBeenCalled()
    expect(store.query(NameState.query())).toBe('ddd')
  })

  it('use RemeshDefaultState to set default value', () => {
    const NameState = RemeshDefaultState({
      name: 'NameState',
      default: 'remesh',
    })

    expect(store.query(NameState.query())).toBe('remesh')
  })

  it('use RemeshDeferState for defer state', () => {
    const NameState = RemeshDeferState<void, string>({
      name: 'NameState',
    })

    expect(() => store.query(NameState.query())).toThrow()

    const HasValueEvent = RemeshEvent({ name: 'HasValueEvent' })

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ peek }, name: string) {
        return peek(NameState()) === RemeshValuePlaceholder ? NameState().new(name) : HasValueEvent()
      },
    })

    store.sendCommand(NameChangeCommand('remesh'))
    expect(store.query(NameState.query())).toBe('remesh')

    const changed = jest.fn()
    store.subscribeEvent(HasValueEvent, changed)
    store.sendCommand(NameChangeCommand('ddd'))
    expect(store.query(NameState.query())).not.toBe('ddd')
    expect(changed).toHaveBeenCalled()
  })

  it('declare custom comparator using options.compare', () => {
    const defaultState = {
      bar: {
        foo: {
          value: 123,
        },
      },
    }
    const NestedState = RemeshDefaultState({
      name: 'NestedState',
      default: defaultState,
      compare(oldState, newState) {
        return JSON.stringify(oldState) === JSON.stringify(newState)
      },
    })

    expect(store.query(NestedState.query())).toBe(defaultState)

    const newState = {
      bar: {
        foo: {
          value: 123,
          cannotStringifyFunction: () => 123,
        },
      },
    }
    const NewStateCommand = RemeshCommand({
      name: 'NewStateCommand',
      impl() {
        return NestedState().new(newState)
      },
    })

    const changed = jest.fn()
    store.subscribeQuery(NestedState.query(), changed)

    store.sendCommand(NewStateCommand())

    expect(changed).not.toHaveBeenCalled()
    expect(store.query(NestedState.query())).not.toBe(newState)

    expect(store.query(NestedState.query())).toBe(defaultState)
  })

  it('the owner domain of RemeshState is DefaultDomain', () => {
    const NameState = RemeshState({
      name: 'NameState',
      impl: () => 'remesh',
    })

    expect(NameState.owner).toBe(DefaultDomain())
  })

  it('state with RemeshDomain', () => {
    const TestDomain = RemeshDomain({
      name: 'domain',
      impl(domain) {
        const NameState = domain.state({
          name: 'NameState',
          default: 'remesh',
        })

        const AgeState = domain.state({
          name: 'AgeState',
          impl() {
            return 18
          },
        })

        const UpdateAgeCommand = domain.command({
          name: 'UpdateAgeCommand',
          impl(_, age: number) {
            return AgeState().new(age)
          },
        })

        // defer
        const SalaryState = domain.state<void, number>({
          name: 'SalaryState',
        })

        const SaveSalaryCommand = domain.command({
          name: 'SaveSalaryCommand',
          impl(_, salary: number) {
            return SalaryState().new(salary)
          },
        })

        return {
          query: {
            AgeQuery: AgeState.query,
            NameQuery: NameState.query,
            SalaryQuery: SalaryState.query,
          },
          command: {
            UpdateAgeCommand,
            SaveSalaryCommand,
          },
        }
      },
    })

    const domain = store.getDomain(TestDomain())

    expect(store.query(domain.query.NameQuery())).toBe('remesh')

    expect(store.query(domain.query.AgeQuery())).toBe(18)
    domain.command.UpdateAgeCommand(20)
    expect(store.query(domain.query.AgeQuery())).toBe(20)

    expect(() => store.query(domain.query.SalaryQuery())).toThrow()

    domain.command.SaveSalaryCommand(20000)
    expect(store.query(domain.query.SalaryQuery())).toBe(20000)
  })
})
