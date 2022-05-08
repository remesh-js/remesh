import {
  InspectorType,
  RemeshCommand$ReceivedEventData,
  RemeshCommandReceivedEventData,
  RemeshDefaultState,
  RemeshDomain,
  RemeshDomainStorageEventData,
  RemeshEventEmittedEventData,
  RemeshExtern,
  RemeshInspectorDomain,
  RemeshQueryStorageEventData,
  RemeshStateStorageEventData,
  RemeshStore,
  RemeshStoreOptions,
} from '../src'
import { delay, map, Observable } from 'rxjs'

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

describe('store', () => {
  it('basic', () => {
    const store = RemeshStore({
      name: 'store',
    })

    expect(store.name).toBe('store')

    const command$Called = jest.fn()
    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const AState = domain.state({
          name: 'AState',
          default: 1,
        })

        const UpdateACommand = domain.command({
          name: 'UpdateACommand',
          impl(_, num: number) {
            return AState().new(num)
          },
        })

        const BState = domain.state({
          name: 'BState',
          default: 2,
        })

        const JoinQuery = domain.query({
          name: 'JoinQuery',
          impl({ get }, joinChar: string) {
            return get(AState.query()) + joinChar + get(BState.query())
          },
        })

        const TestEvent = domain.event({
          name: 'TestEvent',
          impl(_, arg?: string) {
            return arg
          },
        })

        const init$ = domain.command$({
          name: 'init',
          impl(_, payload$) {
            command$Called()
            return payload$.pipe()
          },
        })

        domain.ignite(() => init$())

        return {
          query: { AQuery: AState.query, BQuery: BState.query, JoinQuery },
          event: { TestEvent },
          command: { UpdateA: UpdateACommand },
        }
      },
    })

    const testDomain = store.getDomain(TestDomain())
    store.subscribeDomain(TestDomain())
    expect(command$Called).toHaveBeenCalled()

    expect(store.getKey(testDomain.query.AQuery())).toMatch(testDomain.query.AQuery.queryName)
    expect(store.getKey(testDomain.query.BQuery())).toMatch(testDomain.query.BQuery.queryName)
    expect(store.getKey(testDomain.query.JoinQuery('-'))).toMatch(testDomain.query.JoinQuery.queryName)
    expect(store.getKey(testDomain.query.JoinQuery('-'))).toMatch(JSON.stringify('-'))
    expect(store.getKey(TestDomain())).toMatch(TestDomain.domainName)

    const queryCalled = jest.fn()
    store.subscribeQuery(testDomain.query.JoinQuery('-'), queryCalled)
    testDomain.command.UpdateA(2)
    expect(store.query(testDomain.query.JoinQuery('-'))).toBe('2-2')
    expect(queryCalled).toHaveBeenCalledWith('2-2')

    const eventCalled = jest.fn()
    store.subscribeEvent(testDomain.event.TestEvent, eventCalled)
    store.emitEvent(testDomain.event.TestEvent())
    expect(eventCalled).toHaveBeenCalled()
    store.emitEvent(testDomain.event.TestEvent('test'))
    expect(eventCalled).toHaveBeenCalledWith('test')
  })

  it('basic without domain', () => {
    const store = RemeshStore({
      name: 'store',
    })

    expect(store.name).toBe('store')

    const AState = RemeshDefaultState({
      name: 'AState',
      default: 1,
    })

    const BState = RemeshDefaultState({
      name: 'BState',
      default: 2,
    })

    expect(store.getKey(AState.query())).toMatch(AState.stateName)
    expect(store.getKey(BState.query())).toMatch(BState.stateName)
    expect(store.getKey(AState())).toMatch(AState.stateName)
    expect(store.getKey(BState())).toMatch(BState.stateName)
  })

  it('replacing the implementation of extern', () => {
    type IStorage = {
      get(key: any): any
      set(key: any, value: any): void
    }

    const StorageExtern = RemeshExtern<IStorage>({
      name: 'StorageExtern',
      default: {
        get() {
          throw new Error('Not implemented')
        },
        set() {
          throw new Error('Not implemented')
        },
      },
    })

    const Test1ExternDomain = RemeshDomain({
      name: 'TestExternDomain',
      impl(domain) {
        const storage = domain.getExtern(StorageExtern)
        expect(() => storage.set('a', 1)).toThrow()
        expect(() => storage.get('a')).toThrow()

        return {}
      },
    })

    const store1 = RemeshStore({
      name: 'store',
    })

    store1.getDomain(Test1ExternDomain())

    const Test2ExternDomain = RemeshDomain({
      name: 'TestExternDomain',
      impl(domain) {
        const storage = domain.getExtern(StorageExtern)
        expect(() => storage.set('a', 1)).not.toThrow()
        expect(storage.get('a')).toBe(1)

        return {}
      },
    })

    const cache = {}
    const store2 = RemeshStore({
      name: 'store',
      externs: [
        StorageExtern({
          get(key: string): any {
            return cache[key]
          },
          set(key: string, value: any) {
            cache[key] = value
          },
        }),
      ],
    })

    store2.getDomain(Test2ExternDomain())
  })

  it('inspectors', () => {
    const log = (options: {
      storageEventHandler: (
        data:
          | RemeshDomainStorageEventData<any, any>
          | RemeshStateStorageEventData<any, any>
          | RemeshQueryStorageEventData<any, any>
          | RemeshEventEmittedEventData<any, any>
          | RemeshCommandReceivedEventData<any>
          | RemeshCommand$ReceivedEventData<any>,
      ) => void
    }) => {
      return (storeOptions?: RemeshStoreOptions) => {
        const inspectorStore = RemeshStore({
          ...storeOptions,
          name: 'log-store',
        })

        const inspectorDomain = inspectorStore.getDomain(RemeshInspectorDomain())

        inspectorStore.subscribeEvent(inspectorDomain.event.RemeshDomainStorageEvent, options.storageEventHandler)
        inspectorStore.subscribeEvent(inspectorDomain.event.RemeshStateStorageEvent, options.storageEventHandler)
        inspectorStore.subscribeEvent(inspectorDomain.event.RemeshQueryStorageEvent, options.storageEventHandler)
        inspectorStore.subscribeEvent(inspectorDomain.event.RemeshEventEmittedEvent, options.storageEventHandler)
        inspectorStore.subscribeEvent(inspectorDomain.event.RemeshCommandReceivedEvent, options.storageEventHandler)
        inspectorStore.subscribeEvent(inspectorDomain.event.RemeshCommand$ReceivedEvent, options.storageEventHandler)

        return inspectorStore
      }
    }

    const history: any[] = []
    const store = RemeshStore({
      name: 'store',
      inspectors: [
        log({
          storageEventHandler(data) {
            history.push(data.type)
          },
        }),
      ],
    })

    const NameDomain = RemeshDomain({
      name: 'NameDomain',
      impl(domain) {
        const NameState = domain.state({
          name: 'BarState',
          default: 'bar',
        })

        const NameQuery = domain.query({
          name: 'NameQuery',
          impl({ get }) {
            return get(NameState())
          },
        })

        const NameChangedEvent = domain.event<string>({
          name: 'NameChangedEvent',
        })

        const UpdateNameCommand = domain.command({
          name: 'UpdateNameCommand',
          impl(_, name: string) {
            return [NameState().new(name), NameChangedEvent(name)]
          },
        })

        return {
          query: { Name: NameQuery },
          command: { UpdateName: UpdateNameCommand },
          event: { NameChanged: NameChangedEvent },
        }
      },
    })

    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const nameDomain = domain.getDomain(NameDomain())

        const HelloQuery = domain.query({
          name: 'HelloQuery',
          impl({ get }) {
            return `hello~${get(nameDomain.query.Name())}`
          },
        })

        const RemoteUpdateNameCommand$ = domain.command$({
          name: 'RemoteUpdateNameCommand$',
          impl(_, payload$: Observable<string>) {
            return payload$.pipe(
              delay(1),
              map((name) => nameDomain.command.UpdateName(name)),
            )
          },
        })

        domain.ignite(() => RemoteUpdateNameCommand$('bar'))

        return {
          query: {
            ...nameDomain.query,
            Hello: HelloQuery,
          },
          command: nameDomain.command,
          event: nameDomain.event,
        }
      },
    })

    const execute = () => {
      jest.useFakeTimers()

      const testDomain = store.getDomain(TestDomain())
      store.subscribeDomain(TestDomain())
      const changed = jest.fn()
      store.subscribeEvent(testDomain.event.NameChanged, changed)

      jest.runOnlyPendingTimers()

      expect(changed).toHaveBeenCalledWith('bar')

      expect(store.query(testDomain.query.Name())).toBe('bar')
      expect(store.query(testDomain.query.Hello())).toBe('hello~bar')
      testDomain.command.UpdateName('foo')

      expect(changed).toHaveBeenCalledWith('foo')
      expect(store.query(testDomain.query.Name())).toBe('foo')
      expect(store.query(testDomain.query.Hello())).toBe('hello~foo')

      store.discard()
    }

    execute()

    const expectedHistory: string[] = [
      InspectorType.DomainCreated,
      InspectorType.DomainCreated,
      InspectorType.Command$Received,
      InspectorType.CommandReceived,
      InspectorType.StateCreated,
      InspectorType.EventEmitted,
      InspectorType.QueryCreated,
      InspectorType.QueryCreated,
      InspectorType.CommandReceived,
      InspectorType.StateUpdated,
      InspectorType.QueryUpdated,
      InspectorType.QueryUpdated,
      InspectorType.EventEmitted,
      InspectorType.DomainDiscarded,
      InspectorType.QueryDiscarded,
      InspectorType.StateDiscarded,
      InspectorType.DomainDiscarded,
      InspectorType.QueryDiscarded,
      InspectorType.DomainReused,
    ]

    expect(history).toStrictEqual(expectedHistory)

    execute()

    const restoreExpectedHistory = expectedHistory.concat([
      InspectorType.DomainReused,
      InspectorType.DomainReused,
      InspectorType.Command$Received,
      InspectorType.CommandReceived,
      InspectorType.StateReused,
      InspectorType.EventEmitted,
      InspectorType.QueryUpdated,
      InspectorType.QueryReused,
      InspectorType.QueryUpdated,
      InspectorType.QueryReused,
      InspectorType.CommandReceived,
      InspectorType.StateUpdated,
      InspectorType.QueryUpdated,
      InspectorType.QueryUpdated,
      InspectorType.EventEmitted,
      InspectorType.DomainDiscarded,
      InspectorType.QueryDiscarded,
      InspectorType.QueryDiscarded,
      InspectorType.StateDiscarded,
      InspectorType.DomainDiscarded,
    ])
    expect(history).toStrictEqual(restoreExpectedHistory)
  })

  it('preload', async () => {
    const CounterDomain = RemeshDomain({
      name: 'CounterDomain',
      impl(domain) {
        const CountState = domain.state({
          name: 'CountState',
          default: 0,
        })

        const UpdateCountCommand = domain.command({
          name: 'UpdateCountCommand',
          impl(_, count: number) {
            return CountState().new(count)
          },
        })

        domain.preload({
          key: 'preload_count',
          query: async () => {
            await utils.delay(100)
            return 10
          },
          command: (_, count) => {
            return UpdateCountCommand(count)
          },
        })

        return {
          query: {
            count: CountState.query,
          },
        }
      },
    })

    await store.preload(CounterDomain())

    expect(store.getDomainPreloadedState(CounterDomain())).toEqual({ preload_count: 10 })

    const preloadedState = store.getPreloadedState()

    store = RemeshStore({
      name: 'store',
      preloadedState,
    })

    const counterDomain = store.getDomain(CounterDomain())

    expect(store.query(counterDomain.query.count())).toBe(10)
  })

  it('store expose api', () => {
    const apiKey = [
      'discard',
      'emitEvent',
      'getDomain',
      'getDomainPreloadedState',
      'getKey',
      'getPreloadedState',
      'name',
      'preload',
      'query',
      'sendCommand',
      'subscribeDomain',
      'subscribeEvent',
      'subscribeQuery',
    ]

    expect(Object.keys(store).sort()).toEqual(apiKey.sort())
  })
})
