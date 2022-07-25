import {
  RemeshState,
  RemeshQuery,
  RemeshStore,
  RemeshCommand,
  RemeshDomain,
  DefaultDomain,
  RemeshEvent,
  RemeshEntity,
} from '../src'

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

  it('use RemeshEntity for defer state', () => {
    type Name = { key: string; value: string }
    const NameEntity = RemeshEntity<Name>({
      name: 'NameEntity',
      key: (name) => name.key,
    })

    const NameQuery = RemeshQuery({
      name: 'NameQuery',
      impl: ({ get }, key: string) => get(NameEntity(key)).value,
    })

    expect(() => store.query(NameQuery('test'))).toThrow()

    const HasValueEvent = RemeshEvent({ name: 'HasValueEvent' })

    const ChangeNameCommand = RemeshCommand({
      name: 'ChangeNameCommand',
      impl({}, name: Name) {
        return [NameEntity(name.key).new(name), HasValueEvent()]
      },
    })

    store.send(ChangeNameCommand({ key: 'test', value: 'remesh' }))
    expect(store.query(NameQuery('test'))).toBe('remesh')

    const changed = jest.fn()
    store.subscribeEvent(HasValueEvent, changed)
    store.send(ChangeNameCommand({ key: 'test', value: 'ddd' }))
    expect(store.query(NameQuery('test'))).toBe('ddd')
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

  it('supports injectEntities', () => {
    type Entity = {
      key: string
      value: number
    }
    const TestEntity = RemeshEntity<Entity>({
      name: 'TestEntity',
      key: (entity) => entity.key,
      injectEntities: [
        {
          key: '0',
          value: 123,
        },
        {
          key: '1',
          value: 456,
        },
      ],
    })

    const TestQuery = RemeshQuery({
      name: 'TestQuery',
      impl({ get }, key: string) {
        return get(TestEntity(key)).value
      },
    })

    expect(store.query(TestQuery('0'))).toBe(123)
    expect(store.query(TestQuery('1'))).toBe(456)
  })
})
