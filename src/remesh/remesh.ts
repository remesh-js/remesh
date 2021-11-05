import { noop, Observable, Subject, Subscription } from "rxjs"

import shallowEqual from 'shallowequal'

type RemeshInjectedContext = {
  get: <T, U>(input: RemeshStateItem<T, U> | RemeshQueryPayload<T, U>) => U
  fromEvent: <T, U>(Event: RemeshEvent<T, U>) => Observable<U>
  fromTask: <T>(Task: RemeshTaskPayload<T>) => Observable<RemeshTaskOutput>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshEvent<T, U> = {
  type: "RemeshEvent"
  eventId: number
  eventName: string
  impl?: (context: RemeshEventContext, arg: T) => U
  (arg: T): RemeshEventPayload<T, U>
  Domain?: RemeshDomain<any>
}

export type RemeshEventPayload<T, U = T> = {
  type: "RemeshEventPayload"
  arg: T
  Event: RemeshEvent<T, U>
}


export type RemeshEventOptions<T, U> = {
  name: string
  impl?: RemeshEvent<T, U>['impl']
}

let eventUid = 0

export const RemeshEvent = <U, T = U>(
  options: RemeshEventOptions<T, U>
): RemeshEvent<T, U> => {
  const eventId = eventUid++

  const Event = ((arg) => {
    return {
      type: "RemeshEventPayload",
      arg,
      Event: Event,
    }
  }) as RemeshEvent<T, U>

  Event.type = 'RemeshEvent'
  Event.eventId = eventId
  Event.eventName = options.name
  Event.impl = options.impl

  return Event
}

export type CompareFn<T> = (prev: T, curr: T) => boolean

export type RemeshState<T, U> = {
  type: 'RemeshState'
  stateId: number
  stateName: string
  impl: (arg: T) => U
  (arg: T): RemeshStateItem<T, U>
  Domain?: RemeshDomain<any>
  compare: CompareFn<U>
}

export type RemeshStateItem<T, U> = {
  type: "RemeshStateItem",
  arg: T,
  State: RemeshState<T, U>
  new: (newState: U) => RemeshStatePayload<T, U>
}

export type RemeshDefaultStateOptions<T> = {
  name: RemeshState<void, T>['stateName']
  default: T
  compare?: RemeshState<void, T>['compare']
}

export const RemeshDefaultState = <T>(options: RemeshDefaultStateOptions<T>): RemeshState<void, T> => {
  return RemeshState({
    name: options.name,
    impl: () => options.default,
    compare: options.compare
  })
}

export type RemeshStatePayload<T, U> = {
  type: 'RemeshStateSetterPayload',
  stateItem: RemeshStateItem<T, U>
  newState: U
}

export type RemeshStateOptions<T, U> = {
  name: RemeshState<T, U>['stateName']
  impl: RemeshState<T, U>['impl']
  compare?: RemeshState<T, U>['compare']
}

let stateUid = 0

export const RemeshState = <U, T = void>(options: RemeshStateOptions<T, U>): RemeshState<T, U> => {
  const stateId = stateUid++

  let cacheForNullary = null as RemeshStateItem<T, U> | null

  const State = (arg => {

    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const stateItem: RemeshStateItem<T, U> = {
      type: 'RemeshStateItem',
      arg,
      State,
      new: (newState) => {
        return {
          type: 'RemeshStateSetterPayload',
          stateItem,
          newState
        }
      }
    }

    if (arg === undefined) {
      cacheForNullary = stateItem
    }

    return stateItem
  }) as RemeshState<T, U>

  State.type = 'RemeshState'
  State.stateId = stateId
  State.stateName = options.name
  State.impl = options.impl
  State.compare = options.compare ?? shallowEqual

  return State
}

export type RemeshQueryContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshQuery<T, U> = {
  type: 'RemeshQuery'
  queryId: number
  queryName: string
  impl: (context: RemeshQueryContext, arg: T) => U
  (arg: T): RemeshQueryPayload<T, U>
  Domain?: RemeshDomain<any>
  compare: CompareFn<U>
}

export type RemeshQueryPayload<T, U> = {
  type: 'RemeshQueryPayload'
  Query: RemeshQuery<T, U>
  arg: T
}

export type RemeshQueryOptions<T, U> = {
  name: RemeshQuery<T, U>["queryName"]
  impl: RemeshQuery<T, U>["impl"]
  compare?: RemeshQuery<T, U>['compare']
}

let queryUid = 0
export const RemeshQuery = <U, T = void>(options: RemeshQueryOptions<T, U>): RemeshQuery<T, U> => {
  const queryId = queryUid++

  /**
   * optimize for nullary query
   */
  let cacheForNullary: RemeshQueryPayload<T, U> | null = null

  const Query = (arg => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const payload: RemeshQueryPayload<T, U> = {
      type: 'RemeshQueryPayload',
      Query,
      arg
    }

    if (arg === undefined) {
      cacheForNullary = payload
    }

    return payload
  }) as RemeshQuery<T, U>

  Query.type = 'RemeshQuery'
  Query.queryId = queryId
  Query.queryName = options.name
  Query.impl = options.impl
  Query.compare = options.compare ?? shallowEqual

  return Query
}

export type RemeshCommandContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshCommandOutput =
  | RemeshStatePayload<any, any>
  | RemeshEventPayload<any, any>
  | RemeshCommandPayload<any>
  | RemeshCommandOutput[]

export type RemeshCommandPayload<T> = {
  type: "RemeshCommandPayload"
  arg: T
  Command: RemeshCommand<T>
}

export type RemeshCommand<T = unknown> = {
  type: "RemeshCommand"
  commandId: number
  commandName: string
  impl: (context: RemeshCommandContext, arg: T) => RemeshCommandOutput
  (arg: T): RemeshCommandPayload<T>
  Event: RemeshEvent<T, T>
  Domain?: RemeshDomain<any>
}

export type RemeshCommandOptions<T> = {
  name: RemeshCommand<T>["commandName"]
  impl: RemeshCommand<T>["impl"]
}

let commandUid = 0

export const RemeshCommand = <T = void>(
  options: RemeshCommandOptions<T>
): RemeshCommand<T> => {
  const commandId = commandUid++

  const Command = ((arg) => {
    return {
      type: 'RemeshCommandPayload',
      arg,
      Command: Command,
    }
  }) as RemeshCommand<T>

  Command.type = 'RemeshCommand'
  Command.commandId = commandId
  Command.commandName = options.name
  Command.impl = options.impl
  Command.Event = RemeshEvent<T, T>({
    name: `Event(${options.name})`
  })

  return Command
}

export type RemeshTaskContext = {
  fromEvent: RemeshInjectedContext['fromEvent']
  fromTask: RemeshInjectedContext['fromTask']
  getExtern: <T, U = T>(Extern: RemeshTaskExtern<T, U>) => U
}

export type RemeshTaskPayload<T> = {
  type: "RemeshTaskPayload"
  arg: T
  Task: RemeshTask<T>
}

export type RemeshTaskOutput =
  | RemeshCommandPayload<any>
  | RemeshEventPayload<any, any>
  | RemeshTaskOutput[]

export type RemeshTask<T> = {
  type: "RemeshTask"
  taskId: number
  taskName: string
  impl: (context: RemeshTaskContext, arg: T) => Observable<RemeshTaskOutput>
  (arg: T): RemeshTaskPayload<T>
  Domain?: RemeshDomain<any>
}

export type RemeshTaskOptions<T> = {
  name: RemeshTask<T>["taskName"]
  impl: RemeshTask<T>["impl"]
}
let taskUid = 0

export const RemeshTask = <T = void>(
  options: RemeshTaskOptions<T>
): RemeshTask<T> => {
  const taskId = taskUid++

  const Task = ((arg) => {
    return {
      type: "RemeshTaskPayload",
      arg,
      Task: Task,
    }
  }) as RemeshTask<T>

  Task.type = 'RemeshTask'
  Task.taskId = taskId
  Task.taskName = options.name
  Task.impl = options.impl

  return Task
}

export type RemeshTaskExternPayload<T, U = T> = {
  type: 'RemeshTaskExternPayload'
  Extern: RemeshTaskExtern<T, U>
  value: T
}

export type RemeshTaskExternContext = {
  getEvent: <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>) => RemeshDomainExtract<T>['event']
  getExtern: RemeshTaskContext['getExtern']
  fromEvent: RemeshTaskContext['fromEvent']
}

export type RemeshTaskExtern<T = unknown, U = T> = {
  type: 'RemeshTaskExtern'
  externName: string
  externId: number
  default: T
  impl?: (context: RemeshTaskExternContext, value: T) => U
  (value: T): RemeshTaskExternPayload<T, U>
}

export type RemeshTaskExternOptions<T, U = T> = {
  name: RemeshTaskExtern<T, U>['externName']
  default: RemeshTaskExtern<T, U>['default']
  impl?: RemeshTaskExtern<T, U>['impl']
}

let taskExternUid = 0
export const RemeshTaskExtern = <T = void, U = T>(options: RemeshTaskExternOptions<T, U>): RemeshTaskExtern<T, U> => {
  const Extern = (value => {
    return {
      type: 'RemeshTaskExternPayload',
      Extern,
      value
    }
  }) as RemeshTaskExtern<T, U>

  Extern.externId = taskExternUid++
  Extern.externName = options.name
  Extern.impl = options.impl
  Extern.default = options.default

  return Extern
}

export type RemeshDomainExtract<T extends RemeshDomainDefinition> = Pick<T, ('query' | 'event') & keyof T>

export type RemeshDomainWidgetExtract<T extends RemeshDomainWidgetDefinition> = Pick<T, ('query' | 'event' | 'command' | 'task') & keyof T>

export type RemeshDomainContext = {
  // definitions
  state<T>(options: RemeshDefaultStateOptions<T>): RemeshState<void, T>
  state<T, U>(options: RemeshStateOptions<T, U>): RemeshState<T, U>
  event: typeof RemeshEvent
  query: typeof RemeshQuery
  command: typeof RemeshCommand
  task: typeof RemeshTask
  // methods
  get: <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>) => RemeshDomainExtract<T>
  use: <T extends RemeshDomainWidgetDefinition, U>(payload: RemeshDomainWidgetPayload<T, U>) => RemeshDomainWidgetExtract<T>
}

export type RemeshDomainOutput = {
  autorun: RemeshTask<void>[]
  event: {
    [key: string]: RemeshEvent<any, any> | RemeshDomainOutput['event']
  },
  query: {
    [key: string]: RemeshQuery<any, any> | RemeshDomainOutput['query']
  }
}

export type RemeshDomainWidgetOutput = {
  autorun: RemeshTask<void>[]
  event: {
    [key: string]: RemeshEvent<any, any> | RemeshDomainWidgetOutput['event']
  },
  query: {
    [key: string]: RemeshQuery<any, any> | RemeshDomainWidgetOutput['query']
  },
  command: {
    [key: string]: RemeshCommand<any> | RemeshDomainWidgetOutput['command']
  },
  task: {
    [key: string]: RemeshTask<any> | RemeshDomainWidgetOutput['task']
  }
}

export type RemeshDomainDefinition = Partial<RemeshDomainOutput>

export type RemeshDomainWidgetDefinition = Partial<RemeshDomainWidgetOutput>

const extractDomain = <T extends RemeshDomainDefinition>(domainOutput: T): RemeshDomainExtract<T> => {
  const result = {} as RemeshDomainExtract<T>

  if (domainOutput.query) {
    result.query = domainOutput.query
  }
  if (domainOutput.event) {
    result.event = domainOutput.event
  }

  return result
}

const extractDomainWidget = <T extends RemeshDomainWidgetDefinition>(domainOutput: T): RemeshDomainWidgetExtract<T> => {
  const result = {} as RemeshDomainWidgetExtract<T>

  if (domainOutput.query) {
    result.query = domainOutput.query
  }
  if (domainOutput.event) {
    result.event = domainOutput.event
  }
  if (domainOutput.command) {
    result.command = domainOutput.command
  }
  if (domainOutput.task) {
    result.task = domainOutput.task
  }

  return result
}


export type RemeshDomain<T extends RemeshDomainDefinition> = {
  type: 'RemeshDomain'
  domainName: string
  domainId: number
  impl: (context: RemeshDomainContext) => T
}

export type RemeshDomainOptions<T> = {
  name: RemeshDomain<T>['domainName']
  impl: RemeshDomain<T>['impl']
}

let domainUid = 0

export const RemeshDomain = <T extends RemeshDomainDefinition>(options: RemeshDomainOptions<T>): RemeshDomain<T> => {
  const Domain: RemeshDomain<T> = {
    type: 'RemeshDomain',
    domainId: domainUid++,
    domainName: options.name,
    impl: options.impl
  }

  return Domain
}

export type RemeshDomainWidgetPayload<T extends RemeshDomainWidgetDefinition, U> = {
  type: 'RemeshDomainWidgetPayload'
  Widget: RemeshDomainWidget<T, U>
  arg: U
}

export type RemeshDomainWidget<T extends RemeshDomainWidgetDefinition, U> = {
  type: 'RemeshDomainWidget',
  impl: (context: RemeshDomainContext, arg: U) => T
  (arg: U): RemeshDomainWidgetPayload<T, U>
}

export const RemeshDomainWidget = <T extends RemeshDomainWidgetDefinition, U = void>(impl: RemeshDomainWidget<T, U>['impl']): RemeshDomainWidget<T, U> => {
  const Widget = (arg => {
    return {
      type: 'RemeshDomainWidgetPayload',
      Widget,
      arg
    }
  }) as RemeshDomainWidget<T, U>

  Widget.type = 'RemeshDomainWidget'
  Widget.impl = impl

  return Widget
}

export type RemeshStore = ReturnType<typeof RemeshStore>

type RemeshStateStorage<T, U> = {
  type: 'RemeshStateStorage'
  State: RemeshState<T, U>
  currentArg: U
  currentKey: string
  currentState: U
  downstreamSet: Set<RemeshQueryStorage<any, any>>
}

type RemeshQueryStorage<T, U> = {
  type: "RemeshQueryStorage"
  Query: RemeshQuery<T, U>
  currentArg: T,
  currentKey: string,
  currentValue: U
  upstreamSet: Set<RemeshQueryStorage<any, any> | RemeshStateStorage<any, any>>
  downstreamSet: Set<RemeshQueryStorage<any, any>>,
  subject: Subject<U>
  observable: Observable<U>
  refCount: number
}

type RemeshEventStorage<T = unknown, U = T> = {
  type: "RemeshEventStorage"
  Event: RemeshEvent<T, U>
  subject: Subject<U>
  observable: Observable<U>
  refCount: number
}

type RemeshDomainStorage<T extends RemeshDomainDefinition> = {
  type: 'RemeshDomainStorage'
  Domain: RemeshDomain<T>
  domain: T
  extractedDomain: RemeshDomainExtract<T>
  upstreamSet: Set<RemeshDomainStorage<any>>
  downstreamSet: Set<RemeshDomainStorage<any>>
  autorunTaskSet: Set<RemeshTask<void>>
  taskSubscriptionSet: Set<Subscription>
  domainSubscriptionSet: Set<Subscription>
  upstreamSubscriptionSet: Set<Subscription>
  autorunTaskSubscriptionSet: Set<Subscription>
  stateMap: Map<string, RemeshStateStorage<any, any>>
  queryMap: Map<string, RemeshQueryStorage<any, any>>
  eventMap: Map<RemeshEvent<any, any>, RemeshEventStorage<any>>
  refCount: number
  running: boolean
}

type RemeshTaskExternStorage<T, U = T> = {
  type: 'RemeshTaskExternStorage',
  Extern: RemeshTaskExtern<T, U>
  currentValue: U
}

export type RemeshStoreOptions = {
  name: string
  externs?: RemeshTaskExternPayload<any>[]
}

const DefaultDomain = RemeshDomain({
  name: 'DefaultDomain',
  impl: () => {
    return {}
  }
})

export const RemeshStore = (options: RemeshStoreOptions) => {
  const dirtySet = new Set<RemeshQueryStorage<any, any>>()
  const domainStorageMap = new Map<RemeshDomain<any>, RemeshDomainStorage<any>>()
  const taskExternStorageMap = new Map<RemeshTaskExtern<any>, RemeshTaskExternStorage<any>>()

  type PendingClearItem = RemeshStateStorage<any, any> | RemeshDomainStorage<any> | RemeshEventStorage<any, any> | RemeshQueryStorage<any, any>

  const pendingStorageSet = new Set<PendingClearItem>()

  const getInjectedTaskExternValue = <T, U>(Extern: RemeshTaskExtern<T, U>): T => {
    for (const payload of options.externs ?? []) {
      if (payload.Extern === Extern) {
        return payload.value
      }
    }
    return Extern.default
  }

  const getTaskExternValue = <T, U = T>(Extern: RemeshTaskExtern<T, U>): U => {
    const injectedValue = getInjectedTaskExternValue(Extern)
    if (Extern.impl) {
      const taskExternContext: RemeshTaskExternContext = {
        getExtern: getTaskExternCurrentValue,
        getEvent: (Domain) => getDomain(Domain).event,
        fromEvent: remeshInjectedContext.fromEvent,
      }
      return Extern.impl(taskExternContext, injectedValue)
    }
    return injectedValue as unknown as U
  }

  const getTaskExternStorage = <T, U = T>(Extern: RemeshTaskExtern<T, U>): RemeshTaskExternStorage<T, U> => {
    const taskExternStorage = taskExternStorageMap.get(Extern)

    if (taskExternStorage) {
      return taskExternStorage
    }

    const currentValue = getTaskExternValue(Extern)

    const currentTaskExternStorage: RemeshTaskExternStorage<T, U> = {
      type: 'RemeshTaskExternStorage',
      Extern,
      currentValue
    }

    taskExternStorageMap.set(Extern, currentTaskExternStorage)

    return getTaskExternStorage(Extern)
  }

  const getTaskExternCurrentValue = <T, U>(Extern: RemeshTaskExtern<T, U>): U => {
    return getTaskExternStorage(Extern).currentValue
  }

  const getStateStorageKey = <T, U>(stateItem: RemeshStateItem<T, U>): string => {
    return `State(${stateItem.State.stateId}):${stateItem.State.stateName}(${JSON.stringify(stateItem.arg)})`
  }

  const getQueryStorageKey = <T, U>(queryPayload: RemeshQueryPayload<T, U>): string => {
    return `State(${queryPayload.Query.queryId}):${queryPayload.Query.queryName}(${JSON.stringify(queryPayload.arg)})`
  }

  const getStateStorage = <T, U>(stateItem: RemeshStateItem<T, U>): RemeshStateStorage<T, U> => {
    const domainStorage = getDomainStorage(stateItem.State.Domain ?? DefaultDomain)
    const key = getStateStorageKey(stateItem)
    const stateStorage = domainStorage.stateMap.get(key)

    if (stateStorage) {
      return stateStorage as RemeshStateStorage<T, U>
    }

    domainStorage.stateMap.set(key, {
      type: 'RemeshStateStorage',
      State: stateItem.State,
      currentArg: stateItem.arg,
      currentKey: key,
      currentState: stateItem.State.impl(stateItem.arg),
      downstreamSet: new Set(),
    })

    console.log('create', key)

    return getStateStorage(stateItem)
  }

  const getEventStorage = <T, U = T>(Event: RemeshEvent<T, U>): RemeshEventStorage<T, U> => {
    const domainStorage = getDomainStorage(Event.Domain ?? DefaultDomain)
    const eventStorage = domainStorage.eventMap.get(Event)

    if (eventStorage) {
      return eventStorage as RemeshEventStorage<T, U>
    }

    const subject = new Subject<U>()

    const observable = new Observable<U>(subscriber => {
      const subscription = subject.subscribe(subscriber)
      currentEventStorage.refCount += 1
      return () => {
        subscription.unsubscribe()
        currentEventStorage.refCount -= 1
        pendingStorageSet.add(currentEventStorage)
        commit()
      }
    })

    const currentEventStorage: RemeshEventStorage<T, U> = {
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable,
      refCount: 0
    }

    domainStorage.eventMap.set(Event, currentEventStorage)

    return getEventStorage(Event)
  }

  const getQueryStorage = <T, U>(queryPayload: RemeshQueryPayload<T, U>): RemeshQueryStorage<T, U> => {
    const domainStorage = getDomainStorage(queryPayload.Query.Domain ?? DefaultDomain)
    const key = getQueryStorageKey(queryPayload)
    const queryStorage = domainStorage.queryMap.get(key)

    if (queryStorage) {
      return queryStorage
    }

    const subject = new Subject<U>()

    const observable = new Observable<U>(subscriber => {
      const subscription = subject.subscribe(subscriber)

      currentQueryStorage.refCount += 1

      return () => {
        subscription.unsubscribe()
        currentQueryStorage.refCount -= 1
        pendingStorageSet.add(currentQueryStorage)
        commit()
      }
    })

    const upstreamSet: RemeshQueryStorage<T, U>['upstreamSet'] = new Set()
    const downstreamSet: RemeshQueryStorage<T, U>['downstreamSet'] = new Set()

    const { Query } = queryPayload

    const queryContext: RemeshQueryContext = {
      get: (input) => {
        if (input.type === 'RemeshStateItem') {
          const upstreamStateStorage = getStateStorage(input)
          upstreamSet.add(upstreamStateStorage)
          return remeshInjectedContext.get(input)
        }

        if (input.type === 'RemeshQueryPayload') {
          const upstreamQueryStorage = getQueryStorage(input)
          upstreamSet.add(upstreamQueryStorage)
          return remeshInjectedContext.get(input)
        }

        throw new Error(`Unexpected input in ctx.get(..): ${input}`)
      }
    }

    const currentValue = Query.impl(queryContext, queryPayload.arg)

    const currentQueryStorage: RemeshQueryStorage<T, U> = {
      type: 'RemeshQueryStorage',
      Query: queryPayload.Query,
      currentArg: queryPayload.arg,
      currentValue,
      currentKey: key,
      upstreamSet,
      downstreamSet,
      subject,
      observable,
      refCount: 0
    }

    for (const upstream of upstreamSet) {
      upstream.downstreamSet.add(currentQueryStorage)
    }

    domainStorage.queryMap.set(key, currentQueryStorage)

    return currentQueryStorage
  }

  const getDomainStorage = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>): RemeshDomainStorage<T> => {
    const domainStorage = domainStorageMap.get(Domain)

    if (domainStorage) {
      return domainStorage
    }

    let isInit = false

    const upstreamSet: RemeshDomainStorage<T>['upstreamSet'] = new Set()
    const autorunTaskSet: RemeshDomainStorage<T>['autorunTaskSet'] = new Set()

    const domainContext: RemeshDomainContext = {
      state: (options: RemeshStateOptions<unknown, unknown> | RemeshDefaultStateOptions<unknown>): any => {
        if ('default' in options) {
          const StaticState = RemeshDefaultState(options)
          StaticState.Domain = Domain
          return StaticState
        }

        const State = RemeshState(options)
        State.Domain = Domain
        return State
      },
      query: options => {
        const Query = RemeshQuery(options)
        Query.Domain = Domain
        return Query
      },
      event: options => {
        const Event = RemeshEvent(options)
        Event.Domain = Domain
        return Event
      },
      command: options => {
        const Command = RemeshCommand(options)
        Command.Domain = Domain
        Command.Event.Domain = Domain
        return Command
      },
      task: options => {
        const Task = RemeshTask(options)
        Task.Domain = Domain
        return Task
      },
      get: (UpstreamDomain) => {
        const upstreamDomainStorage = getDomainStorage(UpstreamDomain)
        const domain = getDomain(UpstreamDomain)

        upstreamSet.add(upstreamDomainStorage)

        return domain
      },
      use: widgetPayload => {
        const { Widget, arg } = widgetPayload
        const widget = Widget.impl(domainContext, arg)

        if (isInit) {
          const autorun: RemeshTask<void>[] = []

          for (const Task of widget.autorun ?? []) {
            if (!currentDomainStorage.autorunTaskSet.has(Task)) {
              autorun.push(Task)
              currentDomainStorage.autorunTaskSet.add(Task)
            }
          }

          handleAutorunTask(autorun)
        } else {
          for (const Task of widget.autorun ?? []) {
            autorunTaskSet.add(Task)
          }
        }

        return extractDomainWidget(widget)
      }
    }

    const domain = Domain.impl(domainContext)

    isInit = true

    for (const Task of domain.autorun ?? []) {
      autorunTaskSet.add(Task)
    }

    const currentDomainStorage: RemeshDomainStorage<T> = {
      type: 'RemeshDomainStorage',
      Domain,
      domain,
      extractedDomain: extractDomain(domain),
      autorunTaskSet,
      upstreamSet,
      downstreamSet: new Set(),
      autorunTaskSubscriptionSet: new Set(),
      taskSubscriptionSet: new Set(),
      upstreamSubscriptionSet: new Set(),
      domainSubscriptionSet: new Set(),
      stateMap: new Map(),
      queryMap: new Map(),
      eventMap: new Map(),
      refCount: 0,
      running: false
    }

    domainStorageMap.set(Domain, currentDomainStorage)

    for (const upstreamDomainStorage of upstreamSet) {
      upstreamDomainStorage.downstreamSet.add(currentDomainStorage)
    }

    return getDomainStorage(Domain)
  }

  const clearQueryStorage = <T, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const domainStorage = getDomainStorage(queryStorage.Query.Domain ?? DefaultDomain)

    queryStorage.subject.complete()
    domainStorage.queryMap.delete(queryStorage.currentKey)

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
  }

  const clearQueryStorageIfNeeded = <T, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    if (queryStorage.refCount !== 0) {
      return
    }

    if (queryStorage.downstreamSet.size !== 0) {
      return
    }

    clearQueryStorage(queryStorage)
  }

  const clearStateStorage = <T, U>(stateStorage: RemeshStateStorage<T, U>) => {
    const domainStorage = getDomainStorage(stateStorage.State.Domain ?? DefaultDomain)

    if (domainStorage.stateMap.has(stateStorage.currentKey)) {
      console.log('delete', stateStorage.currentKey)
    }

    domainStorage.stateMap.delete(stateStorage.currentKey)
  }


  const clearStateStorageIfNeeded = <T, U>(stateStorage: RemeshStateStorage<T, U>) => {
    if (stateStorage.downstreamSet.size !== 0) {
      return
    }

    clearStateStorage(stateStorage)
  }

  const clearEventStorage = <T, U>(eventStorage: RemeshEventStorage<T, U>) => {
    const domainStorage = getDomainStorage(eventStorage.Event.Domain ?? DefaultDomain)

    eventStorage.subject.complete()
    domainStorage.eventMap.delete(eventStorage.Event)
  }

  const clearEventStorageIfNeeded = <T, U>(eventStorage: RemeshEventStorage<T, U>) => {
    if (eventStorage.refCount !== 0) {
      return
    }

    clearEventStorage(eventStorage)
  }

  const clearDomainStorage = <T extends RemeshDomainDefinition>(domainStorage: RemeshDomainStorage<T>) => {
    const upstreamList = [...domainStorage.upstreamSet]

    clearSubscriptionSet(domainStorage.domainSubscriptionSet)
    clearSubscriptionSet(domainStorage.autorunTaskSubscriptionSet)
    clearSubscriptionSet(domainStorage.taskSubscriptionSet)
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

    domainStorage.autorunTaskSubscriptionSet.clear()
    domainStorage.upstreamSubscriptionSet.clear()
    domainStorage.domainSubscriptionSet.clear()
    domainStorage.taskSubscriptionSet.clear()
    domainStorage.autorunTaskSet.clear()
    domainStorage.downstreamSet.clear()
    domainStorage.upstreamSet.clear()
    domainStorage.stateMap.clear()
    domainStorage.queryMap.clear()
    domainStorage.eventMap.clear()

    domainStorageMap.delete(domainStorage.Domain)

    for (const upstreamDomainStorage of upstreamList) {
      upstreamDomainStorage.downstreamSet.delete(domainStorage)
      clearDomainStorageIfNeeded(upstreamDomainStorage)
    }
  }

  const clearDomainStorageIfNeeded = <T extends RemeshDomainDefinition>(domainStorage: RemeshDomainStorage<T>) => {
    if (domainStorage.refCount !== 0) {
      return
    }

    if (domainStorage.downstreamSet.size !== 0) {
      return
    }

    if (domainStorage.taskSubscriptionSet.size !== 0) {
      return
    }

    if (domainStorage.domainSubscriptionSet.size !== 0) {
      return
    }

    clearDomainStorage(domainStorage)
  }

  const getCurrentState = <T, U>(stateItem: RemeshStateItem<T, U>): U => {
    const stateStorage = getStateStorage(stateItem)

    return stateStorage.currentState
  }

  const getCurrentQueryValue = <T, U>(queryPayload: RemeshQueryPayload<T, U>): U => {
    const queryStorage = getQueryStorage(queryPayload)

    return queryStorage.currentValue
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

    fromTask: taskPayload => {
      return handleTaskPayload(taskPayload)
    },
    fromEvent: Event => {
      const eventStorage = getEventStorage(Event)
      return eventStorage.observable
    }
  }

  const updateQueryStorage = <T, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const { Query } = queryStorage

    for (const upstream of queryStorage.upstreamSet) {
      upstream.downstreamSet.delete(queryStorage)
      if (upstream.downstreamSet.size === 0) {
        pendingStorageSet.add(upstream)
      }
    }

    queryStorage.upstreamSet.clear()

    const queryContext: RemeshQueryContext = {
      get: (input) => {
        if (input.type === 'RemeshStateItem') {
          const stateItem = input
          const upstreamStateStorage = getStateStorage(stateItem)
          queryStorage.upstreamSet.add(upstreamStateStorage)
          upstreamStateStorage.downstreamSet.add(queryStorage)
          return remeshInjectedContext.get(stateItem)
        }

        if (input.type === 'RemeshQueryPayload') {
          const queryPayload = input
          const upstreamQueryStorage = getQueryStorage(queryPayload)
          queryStorage.upstreamSet.add(upstreamQueryStorage)
          upstreamQueryStorage.downstreamSet.add(queryStorage)
          return remeshInjectedContext.get(queryPayload)
        }

        throw new Error(`Unexpected input in ctx.get(..): ${input}`)
      }
    }

    const newValue = Query.impl(queryContext, queryStorage.currentArg)

    const isEqual = Query.compare(queryStorage.currentValue, newValue)

    if (isEqual) {
      return
    }

    queryStorage.currentValue = newValue

    dirtySet.add(queryStorage)

    /**
     * updateQueryStorage may update upstream.downstreamSet
     * so it should be converted to an array for avoiding infinite loop
     */
    for (const downstream of [...queryStorage.downstreamSet]) {
      updateQueryStorage(downstream)
    }
  }

  const clearPendingStorageSetIfNeeded = () => {
    if (pendingStorageSet.size === 0) {
      return
    }

    const storageList = [...pendingStorageSet]

    pendingStorageSet.clear()

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

  const clearIfNeeded = () => {
    clearDirtySetIfNeeded()
    clearPendingStorageSetIfNeeded()
  }


  const clearDirtySetIfNeeded = () => {
    if (dirtySet.size === 0) {
      return
    }

    const queryStorageList = [...dirtySet]

    dirtySet.clear()

    for (const queryStorage of queryStorageList) {
      if (!dirtySet.has(queryStorage)) {
        queryStorage.subject.next(queryStorage.currentValue)
      }
    }

    /**
     * recursively consuming dirty set unit it become empty.
     */
    clearDirtySetIfNeeded()
  }

  const tick = createTick(clearIfNeeded)
  const commit = () => {
    tick.commit()
  }

  const handleStatePayload = (statePayload: RemeshStatePayload<any, any>) => {
    const stateStorage = getStateStorage(statePayload.stateItem)
    const isEqual = statePayload.stateItem.State.compare(stateStorage.currentState, statePayload.newState)


    if (isEqual) {
      return
    }

    stateStorage.currentArg = statePayload.stateItem.arg
    stateStorage.currentKey = getStateStorageKey(statePayload.stateItem)
    stateStorage.currentState = statePayload.newState

    /**
     * updateQueryStorage may update upstream.downstreamSet
     * so it should be converted to an array for avoiding infinite loop
     */
    for (const downstream of [...stateStorage.downstreamSet]) {
      updateQueryStorage(downstream)
    }

    commit()
  }

  const handleEventPayload = <T, U = T>(eventPayload: RemeshEventPayload<T, U>) => {
    const { Event, arg } = eventPayload
    const eventStorage = getEventStorage(Event)

    if (Event.impl) {
      const eventContext = {
        get: remeshInjectedContext.get
      }
      const data = Event.impl(eventContext, arg)
      eventStorage.subject.next(data)
    } else {
      eventStorage.subject.next(arg as unknown as U)
    }
  }

  const handleCommandOutput = (commandOutput: RemeshCommandOutput) => {
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
    }

    throw new Error(`Unknown command output of ${commandOutput}`)
  }

  const handleCommandPayload = <T>(commandPayload: RemeshCommandPayload<T>) => {
    const { Command, arg } = commandPayload
    const commandContext: RemeshCommandContext = {
      get: remeshInjectedContext.get,
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

  const handleTaskPayload = <T>(taskPayload: RemeshTaskPayload<T>) => {
    const { Task, arg } = taskPayload

    const taskContext: RemeshTaskContext = {
      fromTask: remeshInjectedContext.fromTask,
      fromEvent: remeshInjectedContext.fromEvent,
      getExtern: getTaskExternCurrentValue
    }

    const taskOutput$ = Task.impl(taskContext, arg)

    const domainStorage = getDomainStorage(Task.Domain ?? DefaultDomain)

    const observable = new Observable<RemeshTaskOutput>(subscriber => {
      const taskSubscription = taskOutput$.subscribe(subscriber)

      addTaskSubscription(domainStorage, taskSubscription)

      return () => {
        taskSubscription.unsubscribe()
      }
    })

    return observable
  }

  const handleTaskOutput = (taskOutput: RemeshTaskOutput) => {
    if (Array.isArray(taskOutput)) {
      for (const item of taskOutput) {
        handleTaskOutput(item)
      }
      return
    }

    if (taskOutput.type === 'RemeshCommandPayload') {
      handleCommandOutput(taskOutput)
      return
    } else if (taskOutput.type === 'RemeshEventPayload') {
      handleEventPayload(taskOutput)
      return
    }

    throw new Error(`Unknown task output of ${taskOutput}`)
  }

  const addTaskSubscription = (domainStorage: RemeshDomainStorage<any>, taskSubscription: Subscription) => {
    handleSubscription(domainStorage.taskSubscriptionSet, taskSubscription)

    taskSubscription.add(() => {
      pendingStorageSet.add(domainStorage)
      commit()
    })
  }

  const addDomainSubscription = (domainStorage: RemeshDomainStorage<any>, domainSubscription: Subscription) => {
    handleSubscription(domainStorage.domainSubscriptionSet, domainSubscription)

    domainSubscription.add(() => {
      pendingStorageSet.add(domainStorage)
      commit()
    })
  }

  const subscribeTask = <T>(taskPayload: RemeshTaskPayload<T>) => {
    const domainStorage = getDomainStorage(taskPayload.Task.Domain ?? DefaultDomain)
    const taskOutput$ = handleTaskPayload(taskPayload)
    const taskSubscription = taskOutput$.subscribe(handleTaskOutput)

    addTaskSubscription(domainStorage, taskSubscription)

    return taskSubscription
  }

  const subscribeQuery = <T, U>(queryPayload: RemeshQueryPayload<T, U>, subscriber: (data: U) => unknown): Subscription => {
    const queryStorage = getQueryStorage(queryPayload)
    const subscription = queryStorage.observable.subscribe(subscriber)

    return subscription
  }

  const subscribeEvent = <T, U = T>(Event: RemeshEvent<T, U>, subscriber: (event: U) => unknown) => {
    const eventStorage = getEventStorage(Event)
    const subscription = eventStorage.observable.subscribe(subscriber)

    return subscription
  }

  const getDomain = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>): RemeshDomainExtract<T> => {
    const domainStorage = getDomainStorage(Domain)
    return domainStorage.extractedDomain
  }

  const runDomainStorageIfNeeded = <T extends RemeshDomainDefinition>(domainStorage: RemeshDomainStorage<T>) => {
    if (domainStorage.running) {
      return
    }

    domainStorage.running = true

    for (const upstreamDomainStorage of domainStorage.upstreamSet) {
      const upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.Domain)
      handleSubscription(domainStorage.upstreamSubscriptionSet, upstreamDomainSubscription)
    }

    handleAutorunTask(domainStorage.autorunTaskSet)
  }

  const handleAutorunTask = (autorunTaskSet: Set<RemeshTask<void>> | RemeshTask<void>[]) => {
    for (const Task of autorunTaskSet ?? []) {
      const domainStorage = getDomainStorage(Task.Domain ?? DefaultDomain)
      const autorunTaskSubscription = handleTaskPayload(Task()).subscribe(handleTaskOutput)
      handleSubscription(domainStorage.autorunTaskSubscriptionSet, autorunTaskSubscription)
    }
  }

  const subscribeDomain = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>): Subscription => {
    const domainStorage = getDomainStorage(Domain)
    const domainSubscription = new Subscription()

    addDomainSubscription(domainStorage, domainSubscription)
    runDomainStorageIfNeeded(domainStorage)

    return domainSubscription
  }

  const destroy = () => {
    for (const domainStorage of domainStorageMap.values()) {
      clearDomainStorage(domainStorage)
    }

    tick.cancel()
    domainStorageMap.clear()
    dirtySet.clear()
  }

  const emit = <T, U>(eventItem: RemeshEventPayload<T, U>) => {
    handleEventPayload(eventItem)
  }


  return {
    name: options.name,
    query: getCurrentQueryValue,
    getDomain,
    emit,
    destroy,
    subscribeTask,
    subscribeQuery,
    subscribeEvent,
    subscribeDomain,
  }
}

export const Remesh = {
  domain: RemeshDomain,
  widget: RemeshDomainWidget,
  extern: RemeshTaskExtern,
  store: RemeshStore
}


const clearSubscriptionSet = (subscriptionSet: Set<Subscription>) => {
  for (const subscription of subscriptionSet) {
    subscription.unsubscribe()
  }
}

const createTick = (f: () => unknown) => {
  let count = 0
  return {
    commit: () => {
      count += 1
      let currentCount = count
      Promise.resolve().then(() => {
        if (currentCount !== count) return
        f()
      }, noop)
    },
    cancel: () => {
      count = -1
    }
  }
}