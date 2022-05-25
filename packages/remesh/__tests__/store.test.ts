import {
  InspectorType,
  RemeshCommandReceivedEventData,
  RemeshDefaultState,
  RemeshDomain,
  RemeshDomainStorageEventData,
  RemeshEventEmittedEventData,
  RemeshExtern,
  RemeshInspectorDomain,
  RemeshQuery,
  RemeshQueryStorageEventData,
  RemeshStateStorageEventData,
  RemeshStore,
  RemeshStoreOptions,
} from '../src'
import { delay, tap, Observable } from 'rxjs'

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

        const AQuery = domain.query({
          name: 'AQuery',
          impl: ({ get }) => {
            return get(AState())
          },
        })

        const UpdateACommand = domain.command({
          name: 'UpdateACommand',
          impl({ set }, num: number) {
            set(AState(), num)
          },
        })

        const BState = domain.state({
          name: 'BState',
          default: 2,
        })

        const BQuery = domain.query({
          name: 'BQuery',
          impl: ({ get }) => {
            return get(BState())
          },
        })

        const JoinQuery = domain.query({
          name: 'JoinQuery',
          impl({ get }, joinChar: string) {
            return get(AQuery()) + joinChar + get(BQuery())
          },
        })

        const TestEvent = domain.event({
          name: 'TestEvent',
          impl(_, arg$: Observable<void | string>) {
            return arg$
          },
        })

        const EmitTestEventCommand = domain.command({
          name: 'EmitTestEventCommand',
          impl({ emit }, arg?: string) {
            emit(TestEvent(arg))
          },
        })

        const InitEvent = domain.event({
          name: 'InitEvent',
          impl(_, payload$) {
            command$Called()
            return payload$
          },
        })

        domain.ignite(({ emit }) => {
          emit(InitEvent())
        })

        return {
          query: { AQuery, BQuery, JoinQuery },
          event: { TestEvent },
          command: { UpdateACommand, EmitTestEventCommand },
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

    testDomain.command.UpdateACommand(2)

    expect(store.query(testDomain.query.JoinQuery('-'))).toBe('2-2')
    expect(queryCalled).toHaveBeenCalledWith('2-2')

    const eventCalled = jest.fn()
    store.subscribeEvent(testDomain.event.TestEvent, eventCalled)
    testDomain.command.EmitTestEventCommand()
    expect(eventCalled).toHaveBeenCalled()
    testDomain.command.EmitTestEventCommand('test')
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

    const AQuery = RemeshQuery({
      name: 'AQuery',
      impl: ({ get }) => {
        return get(AState())
      },
    })

    const BState = RemeshDefaultState({
      name: 'BState',
      default: 2,
    })

    const BQuery = RemeshQuery({
      name: 'BQuery',
      impl: ({ get }) => {
        return get(BState())
      },
    })

    expect(store.getKey(AQuery())).toMatch(AQuery.queryName)
    expect(store.getKey(BQuery())).toMatch(BQuery.queryName)
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
        StorageExtern.impl({
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
          | RemeshCommandReceivedEventData<any, any>,
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
          impl({ set, emit }, name: string) {
            set(NameState(), name)
            emit(NameChangedEvent(name))
          },
        })

        return {
          query: { NameQuery },
          command: { UpdateNameCommand },
          event: { NameChangedEvent },
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
            return `hello~${get(nameDomain.query.NameQuery())}`
          },
        })

        const RemoteUpdateNameEvent = domain.event({
          name: 'RemoteUpdateNameEvent',
          impl({ send  }, payload$: Observable<string>) {
            return payload$.pipe(
              delay(1),
              tap((name) => {
                send(nameDomain.command.UpdateNameCommand(name))
              }),
            )
          },
        })

        domain.ignite(({ emit }) => {
          emit(RemoteUpdateNameEvent('bar'))
        })

        return {
          query: {
            ...nameDomain.query,
            HelloQuery,
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
      store.subscribeEvent(testDomain.event.NameChangedEvent, changed)


      jest.runOnlyPendingTimers()

      expect(changed).toHaveBeenCalledWith('bar')

      expect(store.query(testDomain.query.NameQuery())).toBe('bar')
      expect(store.query(testDomain.query.HelloQuery())).toBe('hello~bar')
      testDomain.command.UpdateNameCommand('foo')

      expect(changed).toHaveBeenCalledWith('foo')
      expect(store.query(testDomain.query.NameQuery())).toBe('foo')
      expect(store.query(testDomain.query.HelloQuery())).toBe('hello~foo')

      store.discard()
    }

    execute()

    const expectedHistory: string[] = [
      InspectorType.DomainCreated,
      InspectorType.DomainCreated,
      InspectorType.EventEmitted,
      InspectorType.CommandReceived,
      InspectorType.StateCreated,
      InspectorType.EventEmitted,
      InspectorType.QueryCreated,
      InspectorType.QueryCreated,
      InspectorType.CommandReceived,
      InspectorType.StateUpdated,
      InspectorType.EventEmitted,
      InspectorType.QueryUpdated,
      InspectorType.QueryUpdated,
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
      InspectorType.EventEmitted,
      InspectorType.CommandReceived,
      InspectorType.StateReused,
      InspectorType.EventEmitted,
      InspectorType.QueryUpdated,
      InspectorType.QueryReused,
      InspectorType.QueryUpdated,
      InspectorType.QueryReused,
      InspectorType.CommandReceived,
      InspectorType.StateUpdated,
      InspectorType.EventEmitted,
      InspectorType.QueryUpdated,
      InspectorType.QueryUpdated,
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

        const CountQuery = domain.query({
          name: 'CountQuery',
          impl({ get }) {
            return get(CountState())
          },
        })

        const UpdateCountCommand = domain.command({
          name: 'UpdateCountCommand',
          impl({ set }, count: number) {
            set(CountState(), count)
          },
        })

        domain.preload({
          key: 'preload_count',
          query: async () => {
            await utils.delay(100)
            return 10
          },
          command: ({ send }, count) => {
            send(UpdateCountCommand(count))
          },
        })

        return {
          query: {
            CountQuery,
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

    expect(store.query(counterDomain.query.CountQuery())).toBe(10)
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
