import {
  RemeshCommandReceivedEventData,
  RemeshState,
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
import { map } from 'rxjs'

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

describe('store', () => {
  it('basic', () => {
    const store = RemeshStore({
      name: 'store',
    })

    expect(store.name).toBe('store')

    const igniteCallback = jest.fn()

    const TestDomain = RemeshDomain({
      name: 'TestDomain',
      impl(domain) {
        const AState = domain.state({
          name: 'AState',
          default: 1,
        })

        const UpdateACommand = domain.command({
          name: 'UpdateACommand',
          impl({}, num: number) {
            return AState().new(num)
          },
        })

        const AQuery = domain.query({
          name: 'AQuery',
          impl: ({ get }) => {
            return get(AState())
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
          impl(_, arg?: string) {
            return arg
          },
        })

        const EmitTestEventCommand = domain.command({
          name: 'EmitTestEventCommand',
          impl({}, arg?: string) {
            return TestEvent(arg)
          },
        })

        const CommandQuery = domain.query({
          name: 'CommandQuery',
          impl({}) {
            return { EmitTestEventCommand, UpdateACommand }
          },
        })

        domain.effect({
          name: 'TestEffect',
          impl: () => {
            igniteCallback()
            return []
          },
        })

        return {
          query: { AQuery, BQuery, JoinQuery, CommandQuery },
          event: { TestEvent },
        }
      },
    })

    const testDomain = store.getDomain(TestDomain())

    const { EmitTestEventCommand, UpdateACommand } = store.query(testDomain.query.CommandQuery())

    store.igniteDomain(TestDomain())
    expect(igniteCallback).toHaveBeenCalled()

    expect(store.getKey(testDomain.query.AQuery())).toMatch(testDomain.query.AQuery.queryName)
    expect(store.getKey(testDomain.query.BQuery())).toMatch(testDomain.query.BQuery.queryName)
    expect(store.getKey(testDomain.query.JoinQuery('-'))).toMatch(testDomain.query.JoinQuery.queryName)
    expect(store.getKey(testDomain.query.JoinQuery('-'))).toMatch(JSON.stringify('-'))
    expect(store.getKey(TestDomain())).toMatch(TestDomain.domainName)

    const queryCalled = jest.fn()
    store.subscribeQuery(testDomain.query.JoinQuery('-'), queryCalled)

    store.send(UpdateACommand(2))

    expect(store.query(testDomain.query.JoinQuery('-'))).toBe('2-2')
    expect(queryCalled).toHaveBeenCalledWith('2-2')

    const eventCalled = jest.fn()
    store.subscribeEvent(testDomain.event.TestEvent, eventCalled)
    store.send(EmitTestEventCommand())
    expect(eventCalled).toHaveBeenCalled()
    store.send(EmitTestEventCommand('test'))
    expect(eventCalled).toHaveBeenCalledWith('test')
  })

  it('basic without domain', () => {
    const store = RemeshStore({
      name: 'store',
    })

    expect(store.name).toBe('store')

    const AState = RemeshState({
      name: 'AState',
      default: 1,
    })

    const AQuery = RemeshQuery({
      name: 'AQuery',
      impl: ({ get }) => {
        return get(AState())
      },
    })

    const BState = RemeshState({
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
          | RemeshStateStorageEventData<any>
          | RemeshQueryStorageEventData<any, any>
          | RemeshEventEmittedEventData<any, any>
          | RemeshCommandReceivedEventData<any>,
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
            return [get(NameState()), { UpdateNameCommand }] as const
          },
        })

        const NameChangedEvent = domain.event<string>({
          name: 'NameChangedEvent',
        })

        const UpdateNameCommand = domain.command({
          name: 'UpdateNameCommand',
          impl({}, name: string) {
            return [NameState().new(name), NameChangedEvent(name)]
          },
        })

        return {
          query: { NameQuery },
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
            const [name] = get(nameDomain.query.NameQuery())
            return `hello~${name}`
          },
        })

        const HelloEvent = domain.event<string>({
          name: 'HelloEvent',
        })

        domain.effect({
          name: 'RemoteUpdateNameEffect',
          impl({ get, fromEvent }) {
            return fromEvent(HelloEvent).pipe(
              map((name) => {
                const [, { UpdateNameCommand }] = get(nameDomain.query.NameQuery())
                return UpdateNameCommand(name)
              }),
            )
          },
        })

        return {
          query: {
            ...nameDomain.query,
            HelloQuery,
          },
          event: {
            ...nameDomain.event,
            HelloEvent,
          },
        }
      },
    })

    const execute = () => {
      jest.useFakeTimers()

      const testDomain = store.getDomain(TestDomain())
      store.igniteDomain(TestDomain())

      const changed = jest.fn()
      store.subscribeEvent(testDomain.event.NameChangedEvent, changed)

      store.send(testDomain.event.HelloEvent('bar'))
      jest.runOnlyPendingTimers()

      expect(changed).toHaveBeenCalledWith('bar')

      // @eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line prefer-const
      let [name, { UpdateNameCommand }] = store.query(testDomain.query.NameQuery())

      expect(name).toBe('bar')
      expect(store.query(testDomain.query.HelloQuery())).toBe('hello~bar')
      store.send(UpdateNameCommand('foo'))

      expect(changed).toHaveBeenCalledWith('foo')
      ;[name] = store.query(testDomain.query.NameQuery())

      expect(name).toBe('foo')
      expect(store.query(testDomain.query.HelloQuery())).toBe('hello~foo')

      store.discard()
    }

    execute()

    const expectedHistory: string[] = [
      'Domain::Created',
      'Domain::Created',
      'Event::Emitted',
      'State::Created',
      'Query::Created',
      'Command::Received',
      'Event::Emitted',
      'Query::Created',
      'Command::Received',
      'State::Updated',
      'Query::Updated',
      'Query::Updated',
      'Event::Emitted',
      'Query::Discarded',
      'State::Discarded',
      'Domain::Discarded',
      'Query::Discarded',
      'Domain::Reused',
      'Domain::Discarded',
      'Domain::Discarded',
    ]

    expect(history).toStrictEqual(expectedHistory)

    execute()

    const restoreExpectedHistory = [
      'Domain::Created',
      'Domain::Created',
      'Event::Emitted',
      'State::Created',
      'Query::Created',
      'Command::Received',
      'Event::Emitted',
      'Query::Created',
      'Command::Received',
      'State::Updated',
      'Query::Updated',
      'Query::Updated',
      'Event::Emitted',
      'Query::Discarded',
      'State::Discarded',
      'Domain::Discarded',
      'Query::Discarded',
      'Domain::Reused',
      'Domain::Discarded',
      'Domain::Discarded',
      'Domain::Reused',
      'Domain::Reused',
      'Event::Emitted',
      'State::Reused',
      'Query::Updated',
      'Query::Reused',
      'Command::Received',
      'Event::Emitted',
      'Query::Updated',
      'Query::Reused',
      'Command::Received',
      'State::Updated',
      'Query::Updated',
      'Query::Updated',
      'Event::Emitted',
      'Query::Discarded',
      'Query::Discarded',
      'State::Discarded',
      'Domain::Discarded',
      'Domain::Discarded',
    ]

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

        domain.preload({
          key: 'preload_count',
          query: async () => {
            await utils.delay(100)
            return 10
          },
          command: ({}, count) => {
            return CountState().new(count)
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
})
