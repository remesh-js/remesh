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
  const NameState = RemeshState({
    name: 'NameState',
    impl: () => 'remesh',
  })

  const NameQuery = RemeshQuery({
    name: 'NameStateQuery',
    impl: ({ get }) => get(NameState()),
  })

  it('use RemeshState to declare state', () => {
    expect(store.query(NameQuery())).toBe('remesh')
  })

  it('use RemeshCommand + State().new() to update state and store.subscribeQuery to subscribe to changes', () => {
    expect(store.query(NameQuery())).toBe('remesh')

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl() {
        return NameState().new('ddd')
      },
    })

    const changed = jest.fn()
    store.subscribeQuery(NameQuery(), changed)

    store.sendCommand(NameChangeCommand())

    expect(changed).toHaveBeenCalled()
    expect(store.query(NameQuery())).toBe('ddd')
  })

  it('use RemeshDefaultState to set default value', () => {
    const NameState = RemeshDefaultState({
      name: 'NameState',
      default: 'remesh',
    })

    const NameQuery = RemeshQuery({
      name: 'NameStateQuery',
      impl: ({ get }) => get(NameState()),
    })

    expect(store.query(NameQuery())).toBe('remesh')
  })

  it('use RemeshDeferState for defer state', () => {
    const NameState = RemeshDeferState<void, string>({
      name: 'NameState',
    })

    const NameQuery = RemeshQuery({
      name: 'NameQuery',
      impl: ({ get }) => get(NameState()),
    })

    expect(() => store.query(NameQuery())).toThrow()

    const HasValueEvent = RemeshEvent({ name: 'HasValueEvent' })

    const NameChangeCommand = RemeshCommand({
      name: 'NameChangeCommand',
      impl({ peek }, name: string) {
        return peek(NameState()) === RemeshValuePlaceholder ? NameState().new(name) : HasValueEvent()
      },
    })

    store.sendCommand(NameChangeCommand('remesh'))
    expect(store.query(NameQuery())).toBe('remesh')

    const changed = jest.fn()
    store.subscribeEvent(HasValueEvent, changed)
    store.sendCommand(NameChangeCommand('ddd'))
    expect(store.query(NameQuery())).not.toBe('ddd')
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

    const NestedQuery = RemeshQuery({
      name: 'NestedQuery',
      impl({ get }) {
        return get(NestedState())
      },
    })

    expect(store.query(NestedQuery())).toBe(defaultState)

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
    store.subscribeQuery(NestedQuery(), changed)

    store.sendCommand(NewStateCommand())

    expect(changed).not.toHaveBeenCalled()
    expect(store.query(NestedQuery())).not.toBe(newState)

    expect(store.query(NestedQuery())).toBe(defaultState)
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
      name: 'TestDomain',
      impl(domain) {
        const AgeState = domain.state({
          name: 'AgeState',
          impl() {
            return 18
          },
        })

        const AgeQuery = domain.query({
          name: 'AgeQuery',
          impl({ get }) {
            return get(AgeState())
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

        const SalaryQuery = domain.query({
          name: 'SalaryQuery',
          impl({ get }) {
            return get(SalaryState())
          },
        })

        const SaveSalaryCommand = domain.command({
          name: 'SaveSalaryCommand',
          impl(_, salary: number) {
            return SalaryState().new(salary)
          },
        })

        return {
          query: {
            AgeQuery,
            NameQuery,
            SalaryQuery,
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
