import { Observable, Observer, Subject, Subscription } from 'rxjs'

import {
  RemeshDomainIgniteFn,
  RemeshCommand,
  RemeshCommand$,
  RemeshCommand$Context,
  RemeshCommand$Payload,
  RemeshCommandContext,
  RemeshCommandOutput,
  RemeshCommandPayload,
  RemeshDefaultState,
  RemeshDefaultStateOptions,
  RemeshDeferState,
  RemeshDeferStateOptions,
  RemeshDomain,
  RemeshDomainContext,
  RemeshDomainDefinition,
  RemeshDomainPayload,
  RemeshEvent,
  RemeshEventOptions,
  RemeshEventPayload,
  RemeshExtern,
  RemeshExternPayload,
  RemeshInjectedContext,
  RemeshQuery,
  RemeshQueryContext,
  RemeshQueryPayload,
  RemeshState,
  RemeshStateItem,
  RemeshStateOptions,
  RemeshStatePayload,
  RemeshValuePlaceholder,
  SerializableType,
  RemeshDomainPreloadOptions,
  Args,
  ValidRemeshDomainDefinition,
} from './remesh'

import { createInspectorManager, InspectorType } from './inspector'

export type PreloadedState = Record<string, SerializableType>

export type RemeshStore = ReturnType<typeof RemeshStore>

let uid = 0

export type RemeshStateStorage<T extends Args<SerializableType>, U> = {
  id: number
  type: 'RemeshStateStorage'
  State: RemeshState<T, U>
  arg: T[0]
  key: string
  currentState: U | RemeshValuePlaceholder
  downstreamSet: Set<RemeshQueryStorage<any, any>>
}

export type RemeshQueryStorage<T extends Args<SerializableType>, U> = {
  id: number
  type: 'RemeshQueryStorage'
  Query: RemeshQuery<T, U>
  arg: T[0]
  key: string
  currentValue: U | RemeshValuePlaceholder
  upstreamSet: Set<RemeshQueryStorage<any, any> | RemeshStateStorage<any, any>>
  downstreamSet: Set<RemeshQueryStorage<any, any>>
  subject: Subject<U>
  observable: Observable<U>
  refCount: number
  status: 'default' | 'wip' | 'updated'
  wipUpstreamSet: Set<RemeshQueryStorage<any, any> | RemeshStateStorage<any, any>>
}

export type RemeshEventStorage<T extends Args, U> = {
  id: number
  type: 'RemeshEventStorage'
  Event: RemeshEvent<T, U>
  subject: Subject<U>
  observable: Observable<U>
  refCount: number
}

export type RemeshCommand$Storage<T> = {
  id: number
  type: 'RemeshCommand$Storage'
  Command$: RemeshCommand$<T>
  subject: Subject<T>
  observable: Observable<T>
  subscription?: Subscription
}

export type RemeshDomainStorage<T extends RemeshDomainDefinition, U extends Args<SerializableType>> = {
  id: number
  type: 'RemeshDomainStorage'
  Domain: RemeshDomain<T, U>
  arg: U[0]
  key: string
  domain: T
  domainContext: RemeshDomainContext
  bindingDomainOutput?: BindingDomainOutput<T>
  domainPayload: RemeshDomainPayload<T, U>
  upstreamSet: Set<RemeshDomainStorage<any, any>>
  downstreamSet: Set<RemeshDomainStorage<any, any>>
  domainSubscriptionSet: Set<Subscription>
  upstreamSubscriptionSet: Set<Subscription>
  igniteFnSet: Set<RemeshDomainIgniteFn>
  preloadOptionsList: RemeshDomainPreloadOptions<any>[]
  preloadedPromise?: Promise<void>
  preloadedState: PreloadedState
  stateMap: Map<string, RemeshStateStorage<any, any>>
  queryMap: Map<string, RemeshQueryStorage<any, any>>
  eventMap: Map<RemeshEvent<any, any>, RemeshEventStorage<any, any>>
  command$Map: Map<RemeshCommand$<any>, RemeshCommand$Storage<any>>
  running: boolean
}

export type RemeshExternStorage<T> = {
  id: number
  type: 'RemeshExternStorage'
  Extern: RemeshExtern<T>
  currentValue: T
}

export type RemeshStoreInspector = typeof RemeshStore

export type RemeshStoreOptions = {
  name?: string
  externs?: RemeshExternPayload<any>[]
  inspectors?: (RemeshStoreInspector | false | undefined | null)[]
  preloadedState?: PreloadedState
}

export type BindingCommand<
  T extends RemeshDomainDefinition,
  C = ValidRemeshDomainDefinition<T>['command'],
> = C extends {}
  ? {
      [key in keyof C]: C[key] extends (...args: infer Args) => any ? (...args: Args) => void : C[key]
    }
  : never

export type BindingDomainOutput<T extends RemeshDomainDefinition> = Omit<ValidRemeshDomainDefinition<T>, 'command'> & {
  command: BindingCommand<T>
}

type PendingClearItem =
  | RemeshStateStorage<any, any>
  | RemeshDomainStorage<any, any>
  | RemeshEventStorage<any, any>
  | RemeshQueryStorage<any, any>

export const RemeshStore = (options?: RemeshStoreOptions) => {
  const config = {
    ...options,
  }

  const inspectorManager = createInspectorManager(config)

  const pendingEmitSet = new Set<RemeshQueryStorage<any, any> | RemeshEventPayload<any, any>>()
  /**
   * Leaf means that the query storage has no downstream query storages
   */
  const pendingLeafSet = new Set<RemeshQueryStorage<any, any>>()
  const pendingClearSet = new Set<PendingClearItem>()

  const domainStorageMap = new Map<string, RemeshDomainStorage<any, any>>()

  const externStorageWeakMap = new WeakMap<RemeshExtern<any>, RemeshExternStorage<any>>()

  const getExternValue = <T>(Extern: RemeshExtern<T>): T => {
    for (const payload of config.externs ?? []) {
      if (payload.Extern === Extern) {
        return payload.value
      }
    }
    return Extern.default
  }

  const getExternStorage = <T>(Extern: RemeshExtern<T>): RemeshExternStorage<T> => {
    const externStorage = externStorageWeakMap.get(Extern)

    if (externStorage) {
      return externStorage
    }

    const currentValue = getExternValue(Extern)

    const currentExternStorage: RemeshExternStorage<T> = {
      id: uid++,
      type: 'RemeshExternStorage',
      Extern,
      currentValue,
    }

    externStorageWeakMap.set(Extern, currentExternStorage)

    return currentExternStorage
  }

  const getExternCurrentValue = <T>(Extern: RemeshExtern<T>): T => {
    return getExternStorage(Extern).currentValue
  }

  const storageKeyWeakMap = new WeakMap<
    RemeshQueryPayload<any, any> | RemeshStateItem<any, any> | RemeshDomainPayload<any, any>,
    string
  >()

  const getStateStorageKey = <T extends Args<SerializableType>, U>(stateItem: RemeshStateItem<T, U>): string => {
    const key = storageKeyWeakMap.get(stateItem)

    if (key) {
      return key
    }

    const stateName = stateItem.State.stateName
    const argString = JSON.stringify(stateItem.arg) ?? ''
    const keyString = `State/${stateItem.State.stateId}/${stateName}:${argString}`

    storageKeyWeakMap.set(stateItem, keyString)

    return keyString
  }

  const getQueryStorageKey = <T extends Args<SerializableType>, U>(queryPayload: RemeshQueryPayload<T, U>): string => {
    const key = storageKeyWeakMap.get(queryPayload)

    if (key) {
      return key
    }

    const queryName = queryPayload.Query.queryName
    const argString = JSON.stringify(queryPayload.arg) ?? ''
    const keyString = `Query/${queryPayload.Query.queryId}/${queryName}:${argString}`

    storageKeyWeakMap.set(queryPayload, keyString)

    return keyString
  }

  const getDomainStorageKey = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ): string => {
    const key = storageKeyWeakMap.get(domainPayload)

    if (key) {
      return key
    }

    const domainName = domainPayload.Domain.domainName
    const argString = JSON.stringify(domainPayload.arg) ?? ''
    const keyString = `Domain/${domainPayload.Domain.domainId}/${domainName}:${argString}`

    storageKeyWeakMap.set(domainPayload, keyString)

    return keyString
  }

  const getStorageKey = <T extends Args<SerializableType>, U>(
    input: RemeshStateItem<T, U> | RemeshQueryPayload<T, U> | RemeshDomainPayload<RemeshDomainDefinition, T>,
  ): string => {
    if (input.type === 'RemeshStateItem') {
      return getStateStorageKey(input)
    } else if (input.type === 'RemeshQueryPayload') {
      return getQueryStorageKey(input)
    }
    return getDomainStorageKey(input)
  }

  const getStateFromStorage = <T extends Args<SerializableType>, U>(storage: RemeshStateStorage<T, U>): U => {
    if (storage.currentState === RemeshValuePlaceholder) {
      throw new Error(`${storage.key} is not found`)
    }
    return storage.currentState
  }

  const stateStorageWeakMap = new WeakMap<RemeshStateItem<any, any>, RemeshStateStorage<any, any>>()

  const getStateValue = <T extends Args<SerializableType>, U>(State: RemeshState<T, U>, arg: T[0]) => {
    return State.defer ? RemeshValuePlaceholder : State.impl(arg)
  }

  const createStateStorage = <T extends Args<SerializableType>, U>(
    stateItem: RemeshStateItem<T, U>,
  ): RemeshStateStorage<T, U> => {
    const domainStorage = getDomainStorage(stateItem.State.owner)
    const key = getStateStorageKey(stateItem)

    const currentState = getStateValue(stateItem.State, stateItem.arg)

    const newStateStorage: RemeshStateStorage<T, U> = {
      id: uid++,
      type: 'RemeshStateStorage',
      State: stateItem.State,
      arg: stateItem.arg,
      key,
      currentState,
      downstreamSet: new Set(),
    }

    domainStorage.stateMap.set(key, newStateStorage)
    stateStorageWeakMap.set(stateItem, newStateStorage)

    inspectorManager.inspectStateStorage(InspectorType.StateCreated, newStateStorage)

    return newStateStorage
  }

  const restoreStateStorage = <T extends Args<SerializableType>, U>(stateStorage: RemeshStateStorage<T, U>) => {
    const domainStorage = getDomainStorage(stateStorage.State.owner)

    if (domainStorage.stateMap.has(stateStorage.key)) {
      return
    }

    stateStorage.currentState = getStateValue(stateStorage.State, stateStorage.arg)
    domainStorage.stateMap.set(stateStorage.key, stateStorage)
    inspectorManager.inspectStateStorage(InspectorType.StateReused, stateStorage)
  }

  const getStateStorage = <T extends Args<SerializableType>, U>(
    stateItem: RemeshStateItem<T, U>,
  ): RemeshStateStorage<T, U> => {
    const domainStorage = getDomainStorage(stateItem.State.owner)
    const key = getStateStorageKey(stateItem)
    const stateStorage = domainStorage.stateMap.get(key)

    if (stateStorage) {
      return stateStorage as RemeshStateStorage<T, U>
    }

    const cachedStorage = stateStorageWeakMap.get(stateItem)

    if (cachedStorage) {
      restoreStateStorage(cachedStorage)
      return cachedStorage
    }

    return createStateStorage(stateItem)
  }

  const eventStorageWeakMap = new WeakMap<RemeshEvent<any, any>, RemeshEventStorage<any, any>>()

  const createEventStorage = <T extends Args, U>(Event: RemeshEvent<T, U>): RemeshEventStorage<T, U> => {
    const domainStorage = getDomainStorage(Event.owner)

    const subject = new Subject<U>()

    const observable = new Observable<U>((subscriber) => {
      const subscription = subject.subscribe(subscriber)
      currentEventStorage.refCount += 1
      return () => {
        subscription.unsubscribe()
        currentEventStorage.refCount -= 1
        pendingClearSet.add(currentEventStorage)
        clearPendingStorageSetIfNeeded()
      }
    })

    const cachedStorage = eventStorageWeakMap.get(Event)

    const currentEventStorage = Object.assign(cachedStorage ?? {}, {
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable,
      refCount: 0,
    } as RemeshEventStorage<T, U>)

    domainStorage.eventMap.set(Event, currentEventStorage)
    eventStorageWeakMap.set(Event, currentEventStorage)

    return currentEventStorage
  }

  const getMaybeEventStorage = <T extends Args, U>(Event: RemeshEvent<T, U>): RemeshEventStorage<T, U> | null => {
    const domainStorage = getDomainStorage(Event.owner)
    const eventStorage = domainStorage.eventMap.get(Event)

    if (eventStorage) {
      return eventStorage as RemeshEventStorage<T, U>
    }

    return null
  }

  const getEventStorage = <T extends Args, U>(Event: RemeshEvent<T, U>): RemeshEventStorage<T, U> => {
    const eventStorage = getMaybeEventStorage(Event)

    if (eventStorage) {
      return eventStorage
    }

    return createEventStorage(Event)
  }

  const queryStorageWeakMap = new WeakMap<RemeshQueryPayload<any, any>, RemeshQueryStorage<any, any>>()

  const createQuery$ = <T extends Args<SerializableType>, U>(get: () => RemeshQueryStorage<T, U>) => {
    const subject = new Subject<U>()

    const observable = new Observable<U>((subscriber) => {
      const subscription = subject.subscribe(subscriber)
      const queryStorage = get()
      queryStorage.refCount += 1

      return () => {
        subscription.unsubscribe()
        queryStorage.refCount -= 1
        pendingClearSet.add(queryStorage)
        clearPendingStorageSetIfNeeded()
      }
    })

    return {
      subject,
      observable,
    }
  }

  const createQueryStorage = <T extends Args<SerializableType>, U>(
    queryPayload: RemeshQueryPayload<T, U>,
  ): RemeshQueryStorage<T, U> => {
    const domainStorage = getDomainStorage(queryPayload.Query.owner)
    const key = getQueryStorageKey(queryPayload)

    const { subject, observable } = createQuery$(() => currentQueryStorage)
    const upstreamSet: RemeshQueryStorage<T, U>['upstreamSet'] = new Set()

    const currentQueryStorage: RemeshQueryStorage<T, U> = {
      id: uid++,
      type: 'RemeshQueryStorage',
      Query: queryPayload.Query,
      arg: queryPayload.arg,
      currentValue: RemeshValuePlaceholder,
      key,
      upstreamSet,
      downstreamSet: new Set(),
      subject,
      observable,
      refCount: 0,
      status: 'default',
      wipUpstreamSet: new Set(),
    }

    const { Query } = queryPayload

    const queryContext: RemeshQueryContext = {
      get: (input) => {
        if (currentQueryStorage.upstreamSet !== upstreamSet) {
          return remeshInjectedContext.get(input)
        }

        if (input.type === 'RemeshStateItem') {
          const upstreamStateStorage = getStateStorage(input)

          currentQueryStorage.upstreamSet.add(upstreamStateStorage)
          upstreamStateStorage.downstreamSet.add(currentQueryStorage)

          return remeshInjectedContext.get(input)
        }

        if (input.type === 'RemeshQueryPayload') {
          const upstreamQueryStorage = getQueryStorage(input)

          currentQueryStorage.upstreamSet.add(upstreamQueryStorage)
          upstreamQueryStorage.downstreamSet.add(currentQueryStorage)

          return remeshInjectedContext.get(input)
        }

        return remeshInjectedContext.get(input)
      },
      peek: remeshInjectedContext.peek,
    }

    const currentValue = Query.impl(queryContext, queryPayload.arg)

    currentQueryStorage.currentValue = currentValue

    domainStorage.queryMap.set(key, currentQueryStorage)
    queryStorageWeakMap.set(queryPayload, currentQueryStorage)

    inspectorManager.inspectQueryStorage(InspectorType.QueryCreated, currentQueryStorage)

    return currentQueryStorage
  }

  const restoreQueryStorage = <T extends Args<SerializableType>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const domainStorage = getDomainStorage(queryStorage.Query.owner)

    if (domainStorage.queryMap.has(queryStorage.key)) {
      return
    }

    const { subject, observable } = createQuery$(() => queryStorage)

    queryStorage.status = 'default'
    queryStorage.subject = subject
    queryStorage.observable = observable
    domainStorage.queryMap.set(queryStorage.key, queryStorage)

    for (const upstream of queryStorage.upstreamSet) {
      upstream.downstreamSet.add(queryStorage)
      if (upstream.type === 'RemeshQueryStorage') {
        restoreQueryStorage(upstream)
      } else if (upstream.type === 'RemeshStateStorage') {
        restoreStateStorage(upstream)
      } else {
        throw new Error(`Unknown upstream: ${upstream}`)
      }
    }

    updateQueryStorage(queryStorage)
    inspectorManager.inspectQueryStorage(InspectorType.QueryReused, queryStorage)
  }

  const getQueryStorage = <T extends Args<SerializableType>, U>(
    queryPayload: RemeshQueryPayload<T, U>,
  ): RemeshQueryStorage<T, U> => {
    const domainStorage = getDomainStorage(queryPayload.Query.owner)
    const key = getQueryStorageKey(queryPayload)
    const queryStorage = domainStorage.queryMap.get(key)

    if (queryStorage) {
      return queryStorage
    }

    const cachedStorage = queryStorageWeakMap.get(queryPayload)

    if (cachedStorage) {
      restoreQueryStorage(cachedStorage)
      return cachedStorage
    }

    return createQueryStorage(queryPayload)
  }

  const command$StorageWeakMap = new WeakMap<RemeshCommand$<any>, RemeshCommand$Storage<any>>()

  const createCommand$Storage = <T>(Command$: RemeshCommand$<T>): RemeshCommand$Storage<T> => {
    const domainStorage = getDomainStorage(Command$.owner)
    const subject = new Subject<T>()
    const observable = subject.asObservable()

    const currentCommand$Storage: RemeshCommand$Storage<T> = {
      id: uid++,
      type: 'RemeshCommand$Storage',
      Command$,
      subject,
      observable,
    }

    domainStorage.command$Map.set(Command$, currentCommand$Storage)
    command$StorageWeakMap.set(Command$, currentCommand$Storage)

    return currentCommand$Storage
  }

  const getCommand$Storage = <T>(Command$: RemeshCommand$<T>): RemeshCommand$Storage<T> => {
    const domainStorage = getDomainStorage(Command$.owner)
    const command$Storage = domainStorage.command$Map.get(Command$)

    if (command$Storage) {
      return command$Storage
    }

    const cachedStorage = command$StorageWeakMap.get(Command$)

    if (cachedStorage) {
      const subject = new Subject<T>()
      const observable = subject.asObservable()

      cachedStorage.subject = subject
      cachedStorage.observable = observable
      cachedStorage.subscription = undefined
      domainStorage.command$Map.set(Command$, cachedStorage)

      return cachedStorage
    }

    return createCommand$Storage(Command$)
  }

  const domainStorageWeakMap = new WeakMap<RemeshDomainPayload<any, any>, RemeshDomainStorage<any, any>>()

  const createDomainStorage = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ): RemeshDomainStorage<T, U> => {
    const key = getDomainStorageKey(domainPayload)

    const upstreamSet: RemeshDomainStorage<T, U>['upstreamSet'] = new Set()
    const igniteFnSet: RemeshDomainStorage<T, U>['igniteFnSet'] = new Set()

    const domainContext: RemeshDomainContext = {
      state: (
        options: RemeshStateOptions<any, any> | RemeshDefaultStateOptions<any> | RemeshDeferStateOptions<any, any>,
      ): any => {
        if ('default' in options) {
          const DefaultState = RemeshDefaultState(options)
          DefaultState.owner = domainPayload
          return DefaultState
        }

        if (!('impl' in options)) {
          const DeferState = RemeshDeferState(options)
          DeferState.owner = domainPayload
          return DeferState
        }

        const State = RemeshState(options)
        State.owner = domainPayload
        return State
      },
      query: (options) => {
        const Query = RemeshQuery(options)
        Query.owner = domainPayload
        return Query
      },
      event: (options: Omit<RemeshEventOptions<any, any>, 'impl'> | RemeshEventOptions<any, any>) => {
        const Event = RemeshEvent(options)
        Event.owner = domainPayload
        return Event as RemeshEvent<any, any>
      },
      command: (options) => {
        const Command = RemeshCommand(options)
        Command.owner = domainPayload
        return Command
      },
      command$: (options) => {
        const Command$ = RemeshCommand$(options)
        Command$.owner = domainPayload
        return Command$
      },
      ignite: (fn) => {
        if (currentDomainStorage.running) {
          ignite(fn)
        } else {
          igniteFnSet.add(fn)
        }
      },
      preload: (preloadOptions) => {
        if (!currentDomainStorage.running) {
          currentDomainStorage.preloadOptionsList.push(preloadOptions)
        }
      },
      getDomain: <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
        upstreamDomainPayload: RemeshDomainPayload<T, U>,
      ) => {
        const upstreamDomainStorage = getDomainStorage(upstreamDomainPayload)

        upstreamSet.add(upstreamDomainStorage)
        upstreamDomainStorage.downstreamSet.add(currentDomainStorage)

        return upstreamDomainStorage.domain as unknown as ValidRemeshDomainDefinition<T>
      },
      getExtern: (Extern) => {
        return getExternCurrentValue(Extern)
      },
    }

    const currentDomainStorage: RemeshDomainStorage<T, U> = {
      id: uid++,
      type: 'RemeshDomainStorage',
      Domain: domainPayload.Domain,
      arg: domainPayload.arg,
      get domain() {
        return domain
      },
      domainContext,
      domainPayload,
      key,
      igniteFnSet,
      upstreamSet,
      downstreamSet: new Set(),
      upstreamSubscriptionSet: new Set(),
      domainSubscriptionSet: new Set(),
      stateMap: new Map(),
      queryMap: new Map(),
      eventMap: new Map(),
      command$Map: new Map(),
      preloadOptionsList: [],
      preloadedState: {},
      refCount: 0,
      running: false,
    }

    const domain = domainPayload.Domain.impl(domainContext, domainPayload.arg)

    domainStorageMap.set(key, currentDomainStorage)
    domainStorageWeakMap.set(domainPayload, currentDomainStorage)

    inspectorManager.inspectDomainStorage(InspectorType.DomainCreated, currentDomainStorage)

    injectPreloadState(currentDomainStorage)

    return currentDomainStorage
  }

  const injectPreloadState = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (!options?.preloadedState) {
      return
    }

    const commandContext = {
      get: remeshInjectedContext.get,
      peek: remeshInjectedContext.peek,
    }

    for (const preloadOptions of domainStorage.preloadOptionsList) {
      if (Object.prototype.hasOwnProperty.call(options.preloadedState, preloadOptions.key)) {
        const data = options.preloadedState[preloadOptions.key]
        const commandOutput = preloadOptions.command(commandContext, data)
        handleCommandOutput(commandOutput)
      }
    }
  }

  const getDomainStorage = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ): RemeshDomainStorage<T, U> => {
    const key = getDomainStorageKey(domainPayload)
    const domainStorage = domainStorageMap.get(key)

    if (domainStorage) {
      return domainStorage
    }

    const cachedStorage = domainStorageWeakMap.get(domainPayload)

    if (cachedStorage) {
      cachedStorage.running = false
      domainStorageMap.set(cachedStorage.key, cachedStorage)

      for (const upstreamDomainStorage of cachedStorage.upstreamSet) {
        upstreamDomainStorage.downstreamSet.add(cachedStorage)
      }

      inspectorManager.inspectDomainStorage(InspectorType.DomainReused, cachedStorage)
      return cachedStorage
    }

    return createDomainStorage(domainPayload)
  }

  const clearQueryStorage = <T extends Args<SerializableType>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const domainStorage = getDomainStorage(queryStorage.Query.owner)

    if (!domainStorage.queryMap.has(queryStorage.key)) {
      return
    }

    domainStorage.queryMap.delete(queryStorage.key)

    inspectorManager.inspectQueryStorage(InspectorType.QueryDiscarded, queryStorage)

    for (const upstreamStorage of queryStorage.upstreamSet) {
      upstreamStorage.downstreamSet.delete(queryStorage)

      if (upstreamStorage.type === 'RemeshQueryStorage') {
        clearQueryStorageIfNeeded(upstreamStorage)
      } else if (upstreamStorage.type === 'RemeshStateStorage') {
        clearStateStorageIfNeeded(upstreamStorage)
      } else {
        throw new Error(`Unknown upstream in clearQueryStorageIfNeeded(..): ${upstreamStorage}`)
      }
    }

    queryStorage.subject.complete()
  }

  const clearQueryStorageIfNeeded = <T extends Args<SerializableType>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    if (queryStorage.refCount !== 0) {
      return
    }

    if (queryStorage.downstreamSet.size !== 0) {
      return
    }

    clearQueryStorage(queryStorage)
  }

  const clearStateStorage = <T extends Args<SerializableType>, U>(stateStorage: RemeshStateStorage<T, U>) => {
    const domainStorage = getDomainStorage(stateStorage.State.owner)

    if (!domainStorage.stateMap.has(stateStorage.key)) {
      return
    }

    inspectorManager.inspectStateStorage(InspectorType.StateDiscarded, stateStorage)
    domainStorage.stateMap.delete(stateStorage.key)
    stateStorage.downstreamSet.clear()
  }

  const clearStateStorageIfNeeded = <T extends Args<SerializableType>, U>(stateStorage: RemeshStateStorage<T, U>) => {
    if (stateStorage.downstreamSet.size !== 0) {
      return
    }

    clearStateStorage(stateStorage)
  }

  const clearEventStorage = <T extends Args, U>(eventStorage: RemeshEventStorage<T, U>) => {
    const domainStorage = getDomainStorage(eventStorage.Event.owner)

    eventStorage.subject.complete()
    domainStorage.eventMap.delete(eventStorage.Event)
  }

  const clearEventStorageIfNeeded = <T extends Args, U>(eventStorage: RemeshEventStorage<T, U>) => {
    if (eventStorage.refCount !== 0) {
      return
    }

    clearEventStorage(eventStorage)
  }

  const clearCommand$Storage = <T>(command$Storage: RemeshCommand$Storage<T>) => {
    const domainStorage = getDomainStorage(command$Storage.Command$.owner)

    command$Storage.subject.complete()
    command$Storage.subscription?.unsubscribe()
    command$Storage.subscription = undefined

    domainStorage.command$Map.delete(command$Storage.Command$)
  }

  const clearDomainStorage = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (!domainStorage.running) {
      return
    }

    domainStorage.running = false

    inspectorManager.inspectDomainStorage(InspectorType.DomainDiscarded, domainStorage)

    clearSubscriptionSet(domainStorage.domainSubscriptionSet)
    clearSubscriptionSet(domainStorage.upstreamSubscriptionSet)

    for (const eventStorage of domainStorage.eventMap.values()) {
      clearEventStorage(eventStorage)
    }

    for (const queryStorage of domainStorage.queryMap.values()) {
      clearQueryStorage(queryStorage)
    }

    for (const stateStorage of domainStorage.stateMap.values()) {
      clearStateStorage(stateStorage)
    }

    for (const command$Storage of domainStorage.command$Map.values()) {
      clearCommand$Storage(command$Storage)
    }

    domainStorage.upstreamSubscriptionSet.clear()
    domainStorage.domainSubscriptionSet.clear()
    domainStorage.downstreamSet.clear()
    domainStorage.stateMap.clear()
    domainStorage.queryMap.clear()
    domainStorage.eventMap.clear()

    domainStorageMap.delete(domainStorage.key)

    for (const upstreamDomainStorage of domainStorage.upstreamSet) {
      upstreamDomainStorage.downstreamSet.delete(domainStorage)
      clearDomainStorageIfNeeded(upstreamDomainStorage)
    }
  }

  const clearDomainStorageIfNeeded = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (domainStorage.downstreamSet.size !== 0) {
      return
    }

    if (domainStorage.domainSubscriptionSet.size !== 0) {
      return
    }

    clearDomainStorage(domainStorage)
  }

  const getCurrentState = <T extends Args<SerializableType>, U>(stateItem: RemeshStateItem<T, U>): U => {
    const stateStorage = getStateStorage(stateItem)

    return getStateFromStorage(stateStorage)
  }

  const getCurrentQueryValue = <T extends Args<SerializableType>, U>(queryPayload: RemeshQueryPayload<T, U>): U => {
    const queryStorage = getQueryStorage(queryPayload)
    const currentValue = queryStorage.currentValue

    if (currentValue === RemeshValuePlaceholder) {
      throw new Error(`Query ${queryStorage.key} is not ready yet.`)
    }

    return currentValue
  }

  const remeshInjectedContext: RemeshInjectedContext = {
    get: (input) => {
      if (input.type === 'RemeshStateItem') {
        return getCurrentState(input)
      }

      if (input.type === 'RemeshQueryPayload') {
        return getCurrentQueryValue(input)
      }

      throw new Error(`Unexpected input in ctx.get(..): ${input}`)
    },
    peek: (input) => {
      if (input.type === 'RemeshStateItem') {
        const storage = getStateStorage(input)
        return storage.currentState
      }

      if (input.type === 'RemeshQueryPayload') {
        const storage = getQueryStorage(input)
        return storage.currentValue
      }

      throw new Error(`Unexpected input in peek(..): ${input}`)
    },
    fromEvent: (Event) => {
      const eventStorage = getEventStorage(Event)
      return eventStorage.observable
    },
    fromQuery: (queryPayload) => {
      const queryStorage = getQueryStorage(queryPayload)
      return queryStorage.observable
    },
  }

  const updateWipQueryStorage = <T extends Args<SerializableType>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    if (queryStorage.wipUpstreamSet.size !== 0) {
      let shouldUpdate = false

      for (const upstream of queryStorage.wipUpstreamSet) {
        if (upstream.type === 'RemeshStateStorage') {
          shouldUpdate = true
        } else if (upstream.type === 'RemeshQueryStorage') {
          if (upstream.status === 'wip') {
            updateWipQueryStorage(upstream)
          }
          if (upstream.status === 'updated') {
            shouldUpdate = true
          }
        }
      }

      queryStorage.wipUpstreamSet.clear()

      if (!shouldUpdate) {
        queryStorage.status = 'default'
        return
      }
    }

    const isUpdated = updateQueryStorage(queryStorage)

    if (isUpdated) {
      queryStorage.status = 'updated'
    } else {
      queryStorage.status = 'default'
    }
  }

  const updateQueryStorage = <T extends Args<SerializableType>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const { Query } = queryStorage

    for (const upstream of queryStorage.upstreamSet) {
      upstream.downstreamSet.delete(queryStorage)
      if (upstream.downstreamSet.size === 0) {
        pendingClearSet.add(upstream)
      }
    }

    const upstreamSet: RemeshQueryStorage<T, U>['upstreamSet'] = new Set()

    queryStorage.upstreamSet = upstreamSet

    const queryContext: RemeshQueryContext = {
      get: (input) => {
        if (queryStorage.upstreamSet !== upstreamSet) {
          return remeshInjectedContext.get(input)
        }

        if (input.type === 'RemeshStateItem') {
          const upstreamStateStorage = getStateStorage(input)

          queryStorage.upstreamSet.add(upstreamStateStorage)
          upstreamStateStorage.downstreamSet.add(queryStorage)

          return remeshInjectedContext.get(input)
        }

        if (input.type === 'RemeshQueryPayload') {
          const upstreamQueryStorage = getQueryStorage(input)

          queryStorage.upstreamSet.add(upstreamQueryStorage)
          upstreamQueryStorage.downstreamSet.add(queryStorage)

          return remeshInjectedContext.get(input)
        }

        return remeshInjectedContext.get(input)
      },
      peek: remeshInjectedContext.peek,
    }

    const newValue = Query.impl(queryContext, queryStorage.arg)

    if (queryStorage.currentValue !== RemeshValuePlaceholder) {
      const isEqual = Query.compare(queryStorage.currentValue, newValue)

      if (isEqual) {
        return false
      }
    }

    queryStorage.currentValue = newValue
    pendingEmitSet.add(queryStorage)

    inspectorManager.inspectQueryStorage(InspectorType.QueryUpdated, queryStorage)

    return true
  }

  const clearPendingStorageSetIfNeeded = () => {
    if (pendingClearSet.size === 0) {
      return
    }

    const storageList = [...pendingClearSet]

    pendingClearSet.clear()

    for (const storage of storageList) {
      if (storage.type === 'RemeshDomainStorage') {
        clearDomainStorageIfNeeded(storage)
      } else if (storage.type === 'RemeshEventStorage') {
        clearEventStorageIfNeeded(storage)
      } else if (storage.type === 'RemeshQueryStorage') {
        clearQueryStorageIfNeeded(storage)
      } else if (storage.type === 'RemeshStateStorage') {
        clearStateStorageIfNeeded(storage)
      }
    }

    clearPendingStorageSetIfNeeded()
  }

  const clearPendingEmitSetIfNeeded = () => {
    if (pendingEmitSet.size === 0) {
      return
    }

    const list = [...pendingEmitSet]

    pendingEmitSet.clear()

    for (const item of list) {
      if (item.type === 'RemeshEventPayload') {
        emitEvent(item)
      } else if (item.type === 'RemeshQueryStorage') {
        if (!pendingEmitSet.has(item)) {
          item.subject.next(item.currentValue)
        }
      }
    }

    /**
     * recursively consuming dirty set unit it become empty.
     */
    clearPendingEmitSetIfNeeded()
  }

  const mark = <T extends Args<SerializableType>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    queryStorage.status = 'wip'

    if (queryStorage.downstreamSet.size > 0) {
      for (const downstream of queryStorage.downstreamSet) {
        if (!downstream.wipUpstreamSet.has(queryStorage)) {
          downstream.wipUpstreamSet.add(queryStorage)
          mark(downstream)
        }
      }
    } else {
      pendingLeafSet.add(queryStorage)
    }
  }

  const clearPendingLeafSetIfNeeded = () => {
    if (pendingLeafSet.size === 0) {
      return
    }

    const queryStorageList = [...pendingLeafSet]

    pendingLeafSet.clear()

    for (const queryStorage of queryStorageList) {
      updateWipQueryStorage(queryStorage)
    }

    /**
     * recursively consuming dirty set unit it become empty.
     */
    clearPendingLeafSetIfNeeded()
  }

  const commit = () => {
    clearPendingLeafSetIfNeeded()
    clearPendingEmitSetIfNeeded()
  }

  const handleStatePayload = <T extends Args<SerializableType>, U>(statePayload: RemeshStatePayload<T, U>) => {
    const stateStorage = getStateStorage(statePayload.stateItem)

    if (stateStorage.currentState !== RemeshValuePlaceholder) {
      const isEqual = statePayload.stateItem.State.compare(stateStorage.currentState, statePayload.newState)

      if (isEqual) {
        return
      }
    }

    stateStorage.currentState = statePayload.newState

    inspectorManager.inspectStateStorage(InspectorType.StateUpdated, stateStorage)

    for (const downstream of stateStorage.downstreamSet) {
      downstream.wipUpstreamSet.add(stateStorage)
      mark(downstream)
    }
  }

  const handleEventPayload = <T extends Args, U>(eventPayload: RemeshEventPayload<T, U>) => {
    pendingEmitSet.add(eventPayload)
  }

  const emitEvent = <T extends Args, U>(eventPayload: RemeshEventPayload<T, U>) => {
    const { Event, arg } = eventPayload
    const eventStorage = getMaybeEventStorage(Event)

    if (!eventStorage) {
      return
    }

    inspectorManager.inspectEventEmitted(InspectorType.EventEmitted, eventPayload)

    if (Event.impl) {
      const eventContext = {
        get: remeshInjectedContext.get,
        peek: remeshInjectedContext.peek,
      }
      const data = Event.impl(eventContext, arg)
      eventStorage.subject.next(data)
    } else {
      eventStorage.subject.next(arg as unknown as U)
    }
  }

  const handleCommandPayload = <T extends Args>(commandPayload: RemeshCommandPayload<T>) => {
    inspectorManager.inspectCommandReceived(InspectorType.CommandReceived, commandPayload)

    const { Command, arg } = commandPayload
    const commandContext: RemeshCommandContext = {
      get: remeshInjectedContext.get,
      peek: remeshInjectedContext.peek,
    }

    const commandOutput = Command.impl(commandContext, arg)
    handleCommandOutput(commandOutput)
  }

  const handleSubscription = (subscriptionSet: Set<Subscription>, subscription: Subscription) => {
    subscriptionSet.add(subscription)

    subscription.add(() => {
      subscriptionSet.delete(subscription)
    })
  }

  const ignite = (fn: RemeshDomainIgniteFn) => {
    const igniteContext = {
      get: remeshInjectedContext.get,
      peek: remeshInjectedContext.peek,
    }
    handleCommandOutput(fn(igniteContext))
  }

  const initCommand$IfNeeded = <T>(Command$: RemeshCommand$<T>) => {
    const command$Storage = getCommand$Storage(Command$)

    if (command$Storage.subscription) {
      return
    }

    const command$Context: RemeshCommand$Context = {
      get: remeshInjectedContext.get,
      peek: remeshInjectedContext.peek,
      fromEvent: remeshInjectedContext.fromEvent,
      fromQuery: remeshInjectedContext.fromQuery,
    }

    const command$ = Command$.impl(command$Context, command$Storage.observable)

    const subscription = command$.subscribe({
      next: (commandOutput) => {
        handleCommandOutput(commandOutput)
        commit()
      },
      complete: () => {
        clearCommand$Storage(command$Storage)
      },
    })

    command$Storage.subscription = subscription
  }

  const handleCommandOutput = (commandOutput: RemeshCommandOutput) => {
    if (!commandOutput) {
      return
    }

    if (Array.isArray(commandOutput)) {
      for (const item of commandOutput) {
        handleCommandOutput(item)
      }
      return
    }

    if (commandOutput.type === 'RemeshCommandPayload') {
      handleCommandPayload(commandOutput)
      return
    } else if (commandOutput.type === 'RemeshEventPayload') {
      handleEventPayload(commandOutput)
      return
    } else if (commandOutput.type === 'RemeshStateSetterPayload') {
      handleStatePayload(commandOutput)
      return
    } else if (commandOutput.type === 'RemeshCommand$Payload') {
      handleCommand$Payload(commandOutput)
      return
    }

    throw new Error(`Unknown command output of ${commandOutput}`)
  }

  const handleCommand$Payload = <T>(command$Payload: RemeshCommand$Payload<T>) => {
    inspectorManager.inspectCommand$Received(InspectorType.Command$Received, command$Payload)

    const { Command$, arg } = command$Payload
    const command$Storage = getCommand$Storage(Command$)

    initCommand$IfNeeded(Command$)
    command$Storage.subject.next(arg)
  }

  const addDomainSubscription = (domainStorage: RemeshDomainStorage<any, any>, domainSubscription: Subscription) => {
    handleSubscription(domainStorage.domainSubscriptionSet, domainSubscription)

    domainSubscription.add(() => {
      pendingClearSet.add(domainStorage)
      clearPendingStorageSetIfNeeded()
    })
  }

  const subscribeQuery = <T extends Args<SerializableType>, U>(
    queryPayload: RemeshQueryPayload<T, U>,
    subscriber: ((data: U) => unknown) | Partial<Observer<U>>,
  ): Subscription => {
    const queryStorage = getQueryStorage(queryPayload)
    const subscription =
      typeof subscriber === 'function'
        ? queryStorage.observable.subscribe(subscriber)
        : queryStorage.observable.subscribe(subscriber)

    return subscription
  }

  const subscribeEvent = <T extends Args, U>(Event: RemeshEvent<T, U>, subscriber: (event: U) => unknown) => {
    const eventStorage = getEventStorage(Event)
    const subscription = eventStorage.observable.subscribe(subscriber)

    return subscription
  }

  const getBindingCommand = <T extends RemeshDomainDefinition>(domain: T) => {
    const command = {} as BindingDomainOutput<T>['command']

    for (const key in domain.command) {
      const Command = domain.command[key]
      if (Command.type === 'RemeshCommand') {
        const commandFactory = Command
        // @ts-ignore - This is a hack to get the type of the command
        command[key] = (arg: any) => sendCommand(commandFactory(arg))
      } else if (Command.type === 'RemeshCommand$') {
        const commandFactory = Command
        // @ts-ignore - This is a hack to get the type of the command
        command[key] = (arg: any) => sendCommand(commandFactory(arg))
      } else {
        throw new Error(`Unknown command: ${Command}`)
      }
    }

    return command
  }

  const getDomain = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ): {
    [key in keyof BindingDomainOutput<T>]: BindingDomainOutput<T>[key]
  } => {
    const domainStorage = getDomainStorage(domainPayload)

    if (domainStorage.bindingDomainOutput) {
      return domainStorage.bindingDomainOutput
    }

    const domain = domainStorage.domain

    const command = getBindingCommand(domain)

    const domainOutput = {
      ...domain,
      command,
    } as unknown as BindingDomainOutput<T>

    domainStorage.bindingDomainOutput = domainOutput

    return domainOutput
  }

  const igniteDomain = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    for (const igniteFn of domainStorage.igniteFnSet) {
      ignite(igniteFn)
    }
  }

  const runDomainStorageIfNeeded = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (domainStorage.running) {
      return
    }

    domainStorage.running = true

    for (const upstreamDomainStorage of domainStorage.upstreamSet) {
      const upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.domainPayload)
      handleSubscription(domainStorage.upstreamSubscriptionSet, upstreamDomainSubscription)
    }

    igniteDomain(domainStorage)
  }

  const subscribeDomain = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ): Subscription => {
    const domainStorage = getDomainStorage(domainPayload)
    const domainSubscription = new Subscription()

    addDomainSubscription(domainStorage, domainSubscription)
    runDomainStorageIfNeeded(domainStorage)

    return domainSubscription
  }

  const discard = () => {
    inspectorManager.destroyInspectors()

    for (const domainStorage of domainStorageMap.values()) {
      clearDomainStorage(domainStorage)
    }
    domainStorageMap.clear()
    pendingEmitSet.clear()
  }

  function sendCommand<T>(input: RemeshCommand$Payload<T>): void
  function sendCommand<T extends Args>(input: RemeshCommandPayload<T>): void
  function sendCommand(input: RemeshCommandPayload<Args> | RemeshCommand$Payload<unknown>) {
    if (input.type === 'RemeshCommandPayload') {
      handleCommandPayload(input)
      commit()
    } else if (input.type === 'RemeshCommand$Payload') {
      handleCommand$Payload(input)
    }
  }

  const preload = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ) => {
    const domainStorage = getDomainStorage(domainPayload)

    if (domainStorage.running) {
      throw new Error(`Domain ${domainPayload.Domain.domainName} was ignited before preloading`)
    }

    if (domainStorage.preloadedPromise) {
      return domainStorage.preloadedPromise
    }

    const preloadedPromise = preloadDomain(domainPayload)

    domainStorage.preloadedPromise = preloadedPromise

    return preloadedPromise
  }

  const preloadDomain = async <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ) => {
    const domainStorage = getDomainStorage(domainPayload)

    await Promise.all(
      Array.from(domainStorage.upstreamSet).map((upstreamDomainStorage) => {
        return preload(upstreamDomainStorage.domainPayload)
      }),
    )

    await Promise.all(
      domainStorage.preloadOptionsList.map(async (preloadOptions) => {
        const queryContext = {
          get: remeshInjectedContext['get'],
          peek: remeshInjectedContext['peek'],
        }

        const data = await preloadOptions.query(queryContext)

        if (Object.prototype.hasOwnProperty.call(domainStorage.preloadedState, preloadOptions.key)) {
          throw new Error(`Duplicate key ${preloadOptions.key}`)
        }

        domainStorage.preloadedState[preloadOptions.key] = data

        const commandContext = {
          ...queryContext,
        }

        const commandOutput = preloadOptions.command(commandContext, data)

        handleCommandOutput(commandOutput)
      }),
    )
  }

  const getPreloadedState = () => {
    const preloadedState = {} as PreloadedState

    for (const domainStorage of domainStorageMap.values()) {
      Object.assign(preloadedState, domainStorage.preloadedState)
    }

    return preloadedState
  }

  const getDomainPreloadedState = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ): PreloadedState => {
    const domainStorage = getDomainStorage(domainPayload)

    return domainStorage.preloadedState
  }

  return {
    name: config.name,
    getDomain,
    query: getCurrentQueryValue,
    emitEvent,
    sendCommand,
    discard,
    preload,
    getPreloadedState,
    getDomainPreloadedState,
    subscribeQuery,
    subscribeEvent,
    subscribeDomain,
    getKey: getStorageKey,
  }
}

const clearSubscriptionSet = (subscriptionSet: Set<Subscription>) => {
  for (const subscription of subscriptionSet) {
    subscription.unsubscribe()
  }
}
