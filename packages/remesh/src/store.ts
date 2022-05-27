import { isObservable, Observable, Observer, Subject, Subscription } from 'rxjs'

import { map } from 'rxjs/operators'

import {
  RemeshDomainIgniteFn,
  RemeshCommand,
  RemeshCommandContext,
  RemeshCommandAction,
  RemeshDefaultState,
  RemeshDefaultStateOptions,
  RemeshDeferState,
  RemeshDeferStateOptions,
  RemeshDomain,
  RemeshDomainContext,
  RemeshDomainDefinition,
  RemeshDomainAction,
  RemeshEvent,
  RemeshEventOptions,
  RemeshEventAction,
  RemeshExtern,
  RemeshExternImpl,
  RemeshInjectedContext,
  RemeshQuery,
  RemeshQueryContext,
  RemeshQueryAction,
  RemeshState,
  RemeshStateItem,
  RemeshStateOptions,
  RemeshValuePlaceholder,
  Serializable,
  RemeshDomainPreloadOptions,
  Args,
  VerifiedRemeshDomainDefinition,
  internalToOriginalEvent,
  toValidRemeshDomainDefinition,
  RemeshSubscribeOnlyEvent,
  RemeshEventContext,
  RemeshDomainIgniteContext,
  RemeshDomainPreloadCommandContext,
} from './remesh'

import { createInspectorManager, InspectorType } from './inspector'

export type PreloadedState = Record<string, Serializable>

export type RemeshStore = ReturnType<typeof RemeshStore>

let uid = 0

export type RemeshStateStorage<T extends Args<Serializable>, U> = {
  id: number
  type: 'RemeshStateStorage'
  State: RemeshState<T, U>
  arg: T[0]
  key: string
  currentState: U | RemeshValuePlaceholder
  downstreamSet: Set<RemeshQueryStorage<any, any>>
}

export type RemeshQueryStorage<T extends Args<Serializable>, U> = {
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
  subject: Subject<T[0]>
  observable: Observable<U>
}

export type RemeshDomainStorage<T extends RemeshDomainDefinition, U extends Args<Serializable>> = {
  id: number
  type: 'RemeshDomainStorage'
  Domain: RemeshDomain<T, U>
  arg: U[0]
  key: string
  domain: T
  domainContext: RemeshDomainContext
  bindingDomainOutput?: BindingDomainOutput<T>
  commandSubscriptionSet: Set<Subscription>
  domainAction: RemeshDomainAction<T, U>
  upstreamSet: Set<RemeshDomainStorage<any, any>>
  downstreamSet: Set<RemeshDomainStorage<any, any>>
  domainSubscriptionSet: Set<Subscription>
  upstreamSubscriptionSet: Set<Subscription>
  igniteFnSet: Set<RemeshDomainIgniteFn>
  igniteSubscriptionSet: Set<Subscription>
  preloadOptionsList: RemeshDomainPreloadOptions<any>[]
  preloadedPromise?: Promise<void>
  preloadedState: PreloadedState
  stateMap: Map<string, RemeshStateStorage<any, any>>
  queryMap: Map<string, RemeshQueryStorage<any, any>>
  eventMap: Map<RemeshEvent<any, any>, RemeshEventStorage<any, any>>
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
  externs?: RemeshExternImpl<any>[]
  inspectors?: (RemeshStoreInspector | false | undefined | null)[]
  preloadedState?: PreloadedState
}

export type BindingCommand<
  T extends RemeshDomainDefinition,
  C = VerifiedRemeshDomainDefinition<T>['command'],
> = C extends {}
  ? {
      [key in keyof C]: C[key] extends (...args: infer Args) => any ? (...args: Args) => void : C[key]
    }
  : never

export type BindingDomainOutput<T extends RemeshDomainDefinition> = Omit<
  VerifiedRemeshDomainDefinition<T>,
  'command'
> & {
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

  const pendingEmitSet = new Set<RemeshQueryStorage<any, any>>()
  /**
   * Leaf means that the query storage has no downstream query storages
   */
  const pendingLeafSet = new Set<RemeshQueryStorage<any, any>>()
  const pendingClearSet = new Set<PendingClearItem>()

  const domainStorageMap = new Map<string, RemeshDomainStorage<any, any>>()

  const externStorageWeakMap = new WeakMap<RemeshExtern<any>, RemeshExternStorage<any>>()

  const getExternValue = <T>(Extern: RemeshExtern<T>): T => {
    for (const externImpl of config.externs ?? []) {
      if (externImpl.Extern === Extern) {
        return externImpl.value
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
    RemeshQueryAction<any, any> | RemeshStateItem<any, any> | RemeshDomainAction<any, any>,
    string
  >()

  const getStateStorageKey = <T extends Args<Serializable>, U>(stateItem: RemeshStateItem<T, U>): string => {
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

  const getQueryStorageKey = <T extends Args<Serializable>, U>(queryAction: RemeshQueryAction<T, U>): string => {
    const key = storageKeyWeakMap.get(queryAction)

    if (key) {
      return key
    }

    const queryName = queryAction.Query.queryName
    const argString = JSON.stringify(queryAction.arg) ?? ''
    const keyString = `Query/${queryAction.Query.queryId}/${queryName}:${argString}`

    storageKeyWeakMap.set(queryAction, keyString)

    return keyString
  }

  const getDomainStorageKey = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ): string => {
    const key = storageKeyWeakMap.get(domainAction)

    if (key) {
      return key
    }

    const domainName = domainAction.Domain.domainName
    const argString = JSON.stringify(domainAction.arg) ?? ''
    const keyString = `Domain/${domainAction.Domain.domainId}/${domainName}:${argString}`

    storageKeyWeakMap.set(domainAction, keyString)

    return keyString
  }

  const getStorageKey = <T extends Args<Serializable>, U>(
    input: RemeshStateItem<T, U> | RemeshQueryAction<T, U> | RemeshDomainAction<RemeshDomainDefinition, T>,
  ): string => {
    if (input.type === 'RemeshStateItem') {
      return getStateStorageKey(input)
    } else if (input.type === 'RemeshQueryAction') {
      return getQueryStorageKey(input)
    }
    return getDomainStorageKey(input)
  }

  const getStateFromStorage = <T extends Args<Serializable>, U>(storage: RemeshStateStorage<T, U>): U => {
    if (storage.currentState === RemeshValuePlaceholder) {
      throw new Error(`${storage.key} is not found`)
    }
    return storage.currentState
  }

  const stateStorageWeakMap = new WeakMap<RemeshStateItem<any, any>, RemeshStateStorage<any, any>>()

  const getStateValue = <T extends Args<Serializable>, U>(State: RemeshState<T, U>, arg: T[0]) => {
    return State.defer ? RemeshValuePlaceholder : State.impl(arg)
  }

  const createStateStorage = <T extends Args<Serializable>, U>(
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

  const restoreStateStorage = <T extends Args<Serializable>, U>(stateStorage: RemeshStateStorage<T, U>) => {
    const domainStorage = getDomainStorage(stateStorage.State.owner)

    if (domainStorage.stateMap.has(stateStorage.key)) {
      return
    }

    stateStorage.currentState = getStateValue(stateStorage.State, stateStorage.arg)
    domainStorage.stateMap.set(stateStorage.key, stateStorage)
    inspectorManager.inspectStateStorage(InspectorType.StateReused, stateStorage)
  }

  const getStateStorage = <T extends Args<Serializable>, U>(
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

    const subject = new Subject<T>()

    const eventContext: RemeshEventContext = {
      get: remeshInjectedContext.get,
      peek: remeshInjectedContext.peek,
    }

    const observable = subject.pipe(
      map((arg) => {
        if (Event.impl) {
          return Event.impl(eventContext, arg)
        } else {
          return arg as unknown as U
        }
      }),
    )

    const cachedStorage = eventStorageWeakMap.get(Event)

    const currentEventStorage = Object.assign(cachedStorage ?? {}, {
      id: uid++,
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable,
    } as RemeshEventStorage<T, U>)

    domainStorage.eventMap.set(Event, currentEventStorage)
    eventStorageWeakMap.set(Event, currentEventStorage)

    return currentEventStorage
  }

  const getEventStorage = <T extends Args, U>(Event: RemeshEvent<T, U>): RemeshEventStorage<T, U> => {
    const domainStorage = getDomainStorage(Event.owner)
    const eventStorage = domainStorage.eventMap.get(Event) ?? createEventStorage(Event)

    return eventStorage as RemeshEventStorage<T, U>
  }

  const queryStorageWeakMap = new WeakMap<RemeshQueryAction<any, any>, RemeshQueryStorage<any, any>>()

  const createQuery$ = <T extends Args<Serializable>, U>(get: () => RemeshQueryStorage<T, U>) => {
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

  const createQueryStorage = <T extends Args<Serializable>, U>(
    queryAction: RemeshQueryAction<T, U>,
  ): RemeshQueryStorage<T, U> => {
    const domainStorage = getDomainStorage(queryAction.Query.owner)
    const key = getQueryStorageKey(queryAction)

    const { subject, observable } = createQuery$(() => currentQueryStorage)
    const upstreamSet: RemeshQueryStorage<T, U>['upstreamSet'] = new Set()

    const currentQueryStorage: RemeshQueryStorage<T, U> = {
      id: uid++,
      type: 'RemeshQueryStorage',
      Query: queryAction.Query,
      arg: queryAction.arg,
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

    const { Query } = queryAction

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

        if (input.type === 'RemeshQueryAction') {
          const upstreamQueryStorage = getQueryStorage(input)

          currentQueryStorage.upstreamSet.add(upstreamQueryStorage)
          upstreamQueryStorage.downstreamSet.add(currentQueryStorage)

          return remeshInjectedContext.get(input)
        }

        return remeshInjectedContext.get(input)
      },
      peek: remeshInjectedContext.peek,
    }

    const currentValue = Query.impl(queryContext, queryAction.arg)

    currentQueryStorage.currentValue = currentValue

    domainStorage.queryMap.set(key, currentQueryStorage)
    queryStorageWeakMap.set(queryAction, currentQueryStorage)

    inspectorManager.inspectQueryStorage(InspectorType.QueryCreated, currentQueryStorage)

    return currentQueryStorage
  }

  const restoreQueryStorage = <T extends Args<Serializable>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
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

  const getQueryStorage = <T extends Args<Serializable>, U>(
    queryAction: RemeshQueryAction<T, U>,
  ): RemeshQueryStorage<T, U> => {
    const domainStorage = getDomainStorage(queryAction.Query.owner)
    const key = getQueryStorageKey(queryAction)
    const queryStorage = domainStorage.queryMap.get(key)

    if (queryStorage) {
      return queryStorage
    }

    const cachedStorage = queryStorageWeakMap.get(queryAction)

    if (cachedStorage) {
      restoreQueryStorage(cachedStorage)
      return cachedStorage
    }

    return createQueryStorage(queryAction)
  }

  const domainStorageWeakMap = new WeakMap<RemeshDomainAction<any, any>, RemeshDomainStorage<any, any>>()

  const createDomainStorage = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ): RemeshDomainStorage<T, U> => {
    const key = getDomainStorageKey(domainAction)

    const upstreamSet: RemeshDomainStorage<T, U>['upstreamSet'] = new Set()
    const igniteFnSet: RemeshDomainStorage<T, U>['igniteFnSet'] = new Set()

    const domainContext: RemeshDomainContext = {
      state: (
        options: RemeshStateOptions<any, any> | RemeshDefaultStateOptions<any> | RemeshDeferStateOptions<any, any>,
      ): any => {
        if ('default' in options) {
          const DefaultState = RemeshDefaultState(options)
          DefaultState.owner = domainAction
          return DefaultState
        }

        if (!('impl' in options)) {
          const DeferState = RemeshDeferState(options)
          DeferState.owner = domainAction
          return DeferState
        }

        const State = RemeshState(options)
        State.owner = domainAction
        return State
      },
      query: (options) => {
        const Query = RemeshQuery(options)
        Query.owner = domainAction
        return Query
      },
      event: (options: Omit<RemeshEventOptions<any, any>, 'impl'> | RemeshEventOptions<any, any>) => {
        const Event = RemeshEvent(options)
        Event.owner = domainAction
        return Event as RemeshEvent<any, any>
      },
      command: (options) => {
        const Command = RemeshCommand(options)
        Command.owner = domainAction
        return Command
      },
      ignite: (fn) => {
        if (!currentDomainStorage.running) {
          igniteFnSet.add(fn)
        }
      },
      preload: (preloadOptions) => {
        if (!currentDomainStorage.running) {
          currentDomainStorage.preloadOptionsList.push(preloadOptions)
        }
      },
      getDomain: <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
        upstreamDomainAction: RemeshDomainAction<T, U>,
      ) => {
        const upstreamDomainStorage = getDomainStorage(upstreamDomainAction)

        upstreamSet.add(upstreamDomainStorage)
        upstreamDomainStorage.downstreamSet.add(currentDomainStorage)

        return upstreamDomainStorage.domain as unknown as VerifiedRemeshDomainDefinition<T>
      },
      getExtern: (Extern) => {
        return getExternCurrentValue(Extern)
      },
    }

    const currentDomainStorage: RemeshDomainStorage<T, U> = {
      id: uid++,
      type: 'RemeshDomainStorage',
      Domain: domainAction.Domain,
      arg: domainAction.arg,
      get domain() {
        return domain
      },
      commandSubscriptionSet: new Set(),
      domainContext,
      domainAction,
      key,
      igniteFnSet,
      igniteSubscriptionSet: new Set(),
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

    const domain = domainAction.Domain.impl(domainContext, domainAction.arg)

    domainStorageMap.set(key, currentDomainStorage)
    domainStorageWeakMap.set(domainAction, currentDomainStorage)

    inspectorManager.inspectDomainStorage(InspectorType.DomainCreated, currentDomainStorage)

    injectPreloadState(currentDomainStorage)

    return currentDomainStorage
  }

  const injectPreloadState = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (!options?.preloadedState) {
      return
    }

    const preloadCommandContext = {
      get: remeshInjectedContext.get,
      peek: remeshInjectedContext.peek,
      set: remeshInjectedContext.set,
      send: remeshInjectedContext.send,
      emit: remeshInjectedContext.emit,
    }

    for (const preloadOptions of domainStorage.preloadOptionsList) {
      if (Object.prototype.hasOwnProperty.call(options.preloadedState, preloadOptions.key)) {
        const data = options.preloadedState[preloadOptions.key]
        preloadOptions.command(preloadCommandContext, data)
      }
    }
  }

  const getDomainStorage = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ): RemeshDomainStorage<T, U> => {
    const key = getDomainStorageKey(domainAction)
    const domainStorage = domainStorageMap.get(key)

    if (domainStorage) {
      return domainStorage
    }

    const cachedStorage = domainStorageWeakMap.get(domainAction)

    if (cachedStorage) {
      cachedStorage.running = false
      domainStorageMap.set(cachedStorage.key, cachedStorage)

      for (const upstreamDomainStorage of cachedStorage.upstreamSet) {
        upstreamDomainStorage.downstreamSet.add(cachedStorage)
      }

      inspectorManager.inspectDomainStorage(InspectorType.DomainReused, cachedStorage)
      return cachedStorage
    }

    return createDomainStorage(domainAction)
  }

  const clearQueryStorage = <T extends Args<Serializable>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
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

  const clearQueryStorageIfNeeded = <T extends Args<Serializable>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    if (queryStorage.refCount !== 0) {
      return
    }

    if (queryStorage.downstreamSet.size !== 0) {
      return
    }

    clearQueryStorage(queryStorage)
  }

  const clearStateStorage = <T extends Args<Serializable>, U>(stateStorage: RemeshStateStorage<T, U>) => {
    const domainStorage = getDomainStorage(stateStorage.State.owner)

    if (!domainStorage.stateMap.has(stateStorage.key)) {
      return
    }

    inspectorManager.inspectStateStorage(InspectorType.StateDiscarded, stateStorage)
    domainStorage.stateMap.delete(stateStorage.key)
    stateStorage.downstreamSet.clear()
  }

  const clearStateStorageIfNeeded = <T extends Args<Serializable>, U>(stateStorage: RemeshStateStorage<T, U>) => {
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
    clearEventStorage(eventStorage)
  }

  const clearDomainStorage = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (!domainStorage.running) {
      return
    }

    domainStorage.running = false

    inspectorManager.inspectDomainStorage(InspectorType.DomainDiscarded, domainStorage)

    clearSubscriptionSet(domainStorage.domainSubscriptionSet)
    clearSubscriptionSet(domainStorage.upstreamSubscriptionSet)
    clearSubscriptionSet(domainStorage.igniteSubscriptionSet)
    clearSubscriptionSet(domainStorage.commandSubscriptionSet)

    for (const eventStorage of domainStorage.eventMap.values()) {
      clearEventStorage(eventStorage)
    }

    for (const queryStorage of domainStorage.queryMap.values()) {
      clearQueryStorage(queryStorage)
    }

    for (const stateStorage of domainStorage.stateMap.values()) {
      clearStateStorage(stateStorage)
    }

    domainStorage.upstreamSubscriptionSet.clear()
    domainStorage.domainSubscriptionSet.clear()
    domainStorage.igniteSubscriptionSet.clear()
    domainStorage.commandSubscriptionSet.clear()
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

  const clearDomainStorageIfNeeded = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
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

  const getCurrentState = <T extends Args<Serializable>, U>(stateItem: RemeshStateItem<T, U>): U => {
    const stateStorage = getStateStorage(stateItem)

    return getStateFromStorage(stateStorage)
  }

  const getCurrentQueryValue = <T extends Args<Serializable>, U>(queryAction: RemeshQueryAction<T, U>): U => {
    const queryStorage = getQueryStorage(queryAction)

    updateWipQueryStorage(queryStorage)

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

      if (input.type === 'RemeshQueryAction') {
        return getCurrentQueryValue(input)
      }

      throw new Error(`Unexpected input in ctx.get(..): ${input}`)
    },
    peek: (input) => {
      if (input.type === 'RemeshStateItem') {
        const storage = getStateStorage(input)
        return storage.currentState
      }

      if (input.type === 'RemeshQueryAction') {
        const storage = getQueryStorage(input)
        return storage.currentValue
      }

      throw new Error(`Unexpected input in peek(..): ${input}`)
    },
    fromEvent: (Event) => {
      if (Event.type === 'RemeshEvent') {
        const eventStorage = getEventStorage(Event)
        return eventStorage.observable
      } else if (Event.type === 'RemeshSubscribeOnlyEvent') {
        const OriginalEvent = internalToOriginalEvent(Event)
        const eventStorage = getEventStorage(OriginalEvent)
        return eventStorage.observable
      }

      throw new Error(`Unexpected input in fromEvent(..): ${Event}`)
    },
    fromQuery: (queryAction) => {
      const queryStorage = getQueryStorage(queryAction)
      return queryStorage.observable
    },
    send: (commandAction) => {
      return handleCommandAction(commandAction)
    },
    emit: (eventAction) => {
      return emitEvent(eventAction)
    },
    set: (stateItem, newState) => {
      setState(stateItem, newState)
      commitOnNextTick()
    },
  }

  const updateWipQueryStorage = <T extends Args<Serializable>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    if (queryStorage.status !== 'wip') {
      return
    }

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

  const updateQueryStorage = <T extends Args<Serializable>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
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

        if (input.type === 'RemeshQueryAction') {
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
      if (!pendingEmitSet.has(item)) {
        item.subject.next(item.currentValue)
      }
    }

    /**
     * recursively consuming dynamic set until it become empty.
     */
    clearPendingEmitSetIfNeeded()
  }

  const mark = <T extends Args<Serializable>, U>(queryStorage: RemeshQueryStorage<T, U>) => {
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
     * recursively consuming dynamic set until it become empty.
     */
    clearPendingLeafSetIfNeeded()
  }

  const commit = () => {
    clearPendingLeafSetIfNeeded()
    clearPendingEmitSetIfNeeded()
  }

  let currentTick = 0
  const commitOnNextTick = () => {
    let tick = currentTick++

    Promise.resolve().then(() => {
      if (tick === currentTick) {
        commit()
      }
    })
  }

  const setState = <T extends Args<Serializable>, U>(stateItem: RemeshStateItem<T, U>, newState: U) => {
    const stateStorage = getStateStorage(stateItem)

    if (stateStorage.currentState !== RemeshValuePlaceholder) {
      const isEqual = stateItem.State.compare(stateStorage.currentState, newState)

      if (isEqual) {
        return
      }
    }

    stateStorage.currentState = newState

    inspectorManager.inspectStateStorage(InspectorType.StateUpdated, stateStorage)

    for (const downstream of stateStorage.downstreamSet) {
      downstream.wipUpstreamSet.add(stateStorage)
      mark(downstream)
    }
  }

  const emitEvent = <T extends Args, U>(eventAction: RemeshEventAction<T, U>) => {
    const { Event, arg } = eventAction
    const eventStorage = getEventStorage(Event)

    inspectorManager.inspectEventEmitted(InspectorType.EventEmitted, eventAction)

    eventStorage.subject.next(arg)
  }

  const commandContext: RemeshCommandContext = {
    get: remeshInjectedContext.get,
    peek: remeshInjectedContext.peek,
    set: remeshInjectedContext.set,
    send: remeshInjectedContext.send,
    emit: remeshInjectedContext.emit,
    fromEvent: remeshInjectedContext.fromEvent,
    fromQuery: remeshInjectedContext.fromQuery,
  }

  const handleCommandAction = <T extends Args, U>(commandAction: RemeshCommandAction<T, U>) => {
    inspectorManager.inspectCommandReceived(InspectorType.CommandReceived, commandAction)

    const { Command, arg } = commandAction

    const fn = Command.impl as (context: RemeshCommandContext, arg: T[0]) => U

    return fn(commandContext, arg)
  }

  const handleSubscription = (subscriptionSet: Set<Subscription>, subscription: Subscription) => {
    subscriptionSet.add(subscription)

    subscription.add(() => {
      subscriptionSet.delete(subscription)
    })
  }

  const igniteContext: RemeshDomainIgniteContext = {
    get: remeshInjectedContext.get,
    peek: remeshInjectedContext.peek,
    send: remeshInjectedContext.send,
    emit: remeshInjectedContext.emit,
    fromEvent: remeshInjectedContext.fromEvent,
    fromQuery: remeshInjectedContext.fromQuery,
  }

  const addDomainSubscription = (domainStorage: RemeshDomainStorage<any, any>, domainSubscription: Subscription) => {
    handleSubscription(domainStorage.domainSubscriptionSet, domainSubscription)

    domainSubscription.add(() => {
      pendingClearSet.add(domainStorage)
      clearPendingStorageSetIfNeeded()
    })
  }

  const subscribeQuery = <T extends Args<Serializable>, U>(
    queryAction: RemeshQueryAction<T, U>,
    subscriber: ((data: U) => unknown) | Partial<Observer<U>>,
  ): Subscription => {
    const queryStorage = getQueryStorage(queryAction)
    const subscription =
      typeof subscriber === 'function'
        ? queryStorage.observable.subscribe(subscriber)
        : queryStorage.observable.subscribe(subscriber)

    return subscription
  }

  const subscribeEvent = <T extends Args, U>(
    Event: RemeshEvent<T, U> | RemeshSubscribeOnlyEvent<T, U>,
    subscriber: (event: U) => unknown,
  ): Subscription => {
    if (Event.type === 'RemeshEvent') {
      const eventStorage = getEventStorage(Event)
      const subscription = eventStorage.observable.subscribe(subscriber)

      return subscription
    } else if (Event.type === 'RemeshSubscribeOnlyEvent') {
      const OriginalEvent = internalToOriginalEvent(Event)
      return subscribeEvent(OriginalEvent, subscriber)
    }

    throw new Error(`Unknown event type of ${Event}`)
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

  const getDomain = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ): {
    [key in keyof BindingDomainOutput<T>]: BindingDomainOutput<T>[key]
  } => {
    const domainStorage = getDomainStorage(domainAction)

    if (domainStorage.bindingDomainOutput) {
      return domainStorage.bindingDomainOutput
    }

    const domain = domainStorage.domain

    const command = getBindingCommand(domain)

    const domainOutput = {
      ...toValidRemeshDomainDefinition(domain),
      command,
    } as unknown as BindingDomainOutput<T>

    domainStorage.bindingDomainOutput = domainOutput

    return domainOutput
  }

  const igniteDomain = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    for (const igniteFn of domainStorage.igniteFnSet) {
      ignite(domainStorage, igniteFn)
    }
  }

  const ignite = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainStorage: RemeshDomainStorage<T, U>,
    igniteFn: RemeshDomainIgniteFn,
  ) => {
    const result = igniteFn(igniteContext)

    if (isObservable(result)) {
      const subscription = result.subscribe(commit)
      domainStorage.igniteSubscriptionSet.add(subscription)
      subscription.add(() => {
        domainStorage.igniteSubscriptionSet.delete(subscription)
      })
    }
  }

  const runDomainStorageIfNeeded = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (domainStorage.running) {
      return
    }

    domainStorage.running = true

    for (const upstreamDomainStorage of domainStorage.upstreamSet) {
      const upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.domainAction)
      handleSubscription(domainStorage.upstreamSubscriptionSet, upstreamDomainSubscription)
    }

    igniteDomain(domainStorage)
  }

  const subscribeDomain = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ): Subscription => {
    const domainStorage = getDomainStorage(domainAction)
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

  const preload = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ) => {
    const domainStorage = getDomainStorage(domainAction)

    if (domainStorage.running) {
      throw new Error(`Domain ${domainAction.Domain.domainName} was ignited before preloading`)
    }

    if (domainStorage.preloadedPromise) {
      return domainStorage.preloadedPromise
    }

    const preloadedPromise = preloadDomain(domainAction)

    domainStorage.preloadedPromise = preloadedPromise

    return preloadedPromise
  }

  const domainPreloadCommandContext: RemeshDomainPreloadCommandContext = {
    get: remeshInjectedContext.get,
    peek: remeshInjectedContext.peek,
    set: remeshInjectedContext.set,
    send: remeshInjectedContext.send,
  }

  const domainPreloadQueryContext = {
    get: remeshInjectedContext.get,
    peek: remeshInjectedContext.peek,
  }

  const preloadDomain = async <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ) => {
    const domainStorage = getDomainStorage(domainAction)

    await Promise.all(
      Array.from(domainStorage.upstreamSet).map((upstreamDomainStorage) => {
        return preload(upstreamDomainStorage.domainAction)
      }),
    )

    await Promise.all(
      domainStorage.preloadOptionsList.map(async (preloadOptions) => {
        const data = await preloadOptions.query(domainPreloadQueryContext)

        if (Object.prototype.hasOwnProperty.call(domainStorage.preloadedState, preloadOptions.key)) {
          throw new Error(`Duplicate key ${preloadOptions.key}`)
        }

        domainStorage.preloadedState[preloadOptions.key] = data

        preloadOptions.command(domainPreloadCommandContext, data)
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

  const getDomainPreloadedState = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ): PreloadedState => {
    const domainStorage = getDomainStorage(domainAction)

    return domainStorage.preloadedState
  }

  const sendCommand = <T extends Args, U>(commandAction: RemeshCommandAction<T, U>) => {
    const result = handleCommandAction(commandAction)
    if (isObservable(result)) {
      const domainStorage = getDomainStorage(commandAction.Command.owner)
      const subscription = result.subscribe(commit)
      domainStorage.commandSubscriptionSet.add(subscription)
      subscription.add(() => {
        domainStorage.commandSubscriptionSet.delete(subscription)
      })
    }
    commit()
  }

  return {
    name: config.name,
    getDomain,
    query: getCurrentQueryValue,
    sendCommand,
    emitEvent,
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
