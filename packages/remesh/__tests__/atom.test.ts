import { RemeshState, RemeshQuery, RemeshStore, RemeshCommand, RemeshDomain, DefaultDomain, RemeshEvent } from '../src'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

describe('atom', () => {
  const NameState = RemeshState({
    name: 'NameState',
    default: 'remesh',
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
      impl({}) {
        return NameState().new('ddd')
      },
    })

    const changed = jest.fn()
    store.subscribeQuery(NameQuery(), changed)

    store.send(NameChangeCommand())

    expect(changed).toHaveBeenCalled()
    expect(store.query(NameQuery())).toBe('ddd')
  })

  it('use RemeshState to set default value', () => {
    const NameState = RemeshState({
      name: 'NameState',
      default: 'remesh',
    })

    const NameQuery = RemeshQuery({
      name: 'NameStateQuery',
      impl: ({ get }) => get(NameState()),
    })

    expect(store.query(NameQuery())).toBe('remesh')
  })

  it('use RemeshState for defer state', () => {
    const NameState = RemeshState<string>({
      name: 'NameState',
      defer: true,
    })

    const NameQuery = RemeshQuery({
      name: 'NameQuery',
      impl: ({ get }) => get(NameState()),
    })

    expect(() => store.query(NameQuery())).toThrow()

    const HasValueEvent = RemeshEvent({ name: 'HasValueEvent' })

    const ChangeNameCommand = RemeshCommand({
      name: 'ChangeNameCommand',
      impl({}, name: string) {
        return [NameState().new(name), HasValueEvent()]
      },
    })

    store.send(ChangeNameCommand('remesh'))
    expect(store.query(NameQuery())).toBe('remesh')

    const changed = jest.fn()
    store.subscribeEvent(HasValueEvent, changed)
    store.send(ChangeNameCommand('ddd'))
    expect(store.query(NameQuery())).toBe('ddd')
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

    const NestedState = RemeshState({
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
      impl({}) {
        return NestedState().new(newState)
      },
    })

    const changed = jest.fn()
    store.subscribeQuery(NestedQuery(), changed)

    store.send(NewStateCommand())

    expect(changed).not.toHaveBeenCalled()
    expect(store.query(NestedQuery())).not.toBe(newState)

    expect(store.query(NestedQuery())).toBe(defaultState)
  })

  it('the owner domain of RemeshState is DefaultDomain', () => {
    const NameState = RemeshState({
      name: 'NameState',
      default: 'remesh',
    })

    expect(NameState.owner).toBe(DefaultDomain())
  })

  it('state with RemeshDomain', () => {
    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const AgeState = domain.state({
          name: 'AgeState',
          default: 18,
        })

        const UpdateAgeCommand = domain.command({
          name: 'UpdateAgeCommand',
          impl({}, age: number) {
            return AgeState().new(age)
          },
        })

        const AgeQuery = domain.query({
          name: 'AgeQuery',
          impl({ get }) {
            return [get(AgeState()), { UpdateAgeCommand }] as const
          },
        })

        return {
          query: {
            AgeQuery,
            NameQuery,
          },
        }
      },
    })

    const domain = store.getDomain(TestDomain())

    let [age, { UpdateAgeCommand }] = store.query(domain.query.AgeQuery())
    const name = store.query(domain.query.NameQuery())

    expect(name).toBe('remesh')

    expect(age).toBe(18)

    store.send(UpdateAgeCommand(20))
    ;[age, { UpdateAgeCommand }] = store.query(domain.query.AgeQuery())

    expect(age).toBe(20)
  })
})
