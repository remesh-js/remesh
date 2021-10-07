import { Observable, Subject, Subscription } from "rxjs"

import shallowEqual from 'shallowequal'

type RemeshInjectedContext = {
  get: <T>(State: RemeshState<T> | RemeshQuery<T>) => T
  fromEvent: <T, U = T>(Event: RemeshEvent<T, U>) => Observable<U>
  fromTask: <T>(Task: RemeshTaskPayload<T>) => Observable<RemeshTaskOutput>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshEvent<T = unknown, U = T> = {
  type: "RemeshEvent"
  eventId: number
  eventName: string
  impl?: (context: RemeshEventContext, arg: T) => U
  (arg: T): RemeshEventPayload<T, U>
  Domain?: RemeshDomain<any>
}

export type RemeshEventPayload<T = unknown, U = T> = {
  type: "RemeshEventPayload"
  arg: T
  Event: RemeshEvent<T, U>
}

export type RemeshEventOptions<T = unknown, U = T> = {
  name: string
  impl?: RemeshEvent<T, U>['impl']
}

let eventUid = 0

export const RemeshEvent = <T = void, U = T>(
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

export type RemeshState<T> = {
  type: 'RemeshState'
  stateId: number
  stateName: string
  default: T
  (newState: T): RemeshStatePayload<T>
  Domain?: RemeshDomain<any>
  compare: CompareFn<T>
}

export type RemeshStatePayload<T = unknown> = {
  type: 'RemeshStatePayload',
  State: RemeshState<T>
  newState: T
}

export type RemeshStateOptions<T> = {
  name: RemeshState<T>['stateName']
  default: RemeshState<T>['default']
  compare?: RemeshState<T>['compare']
}

let stateUid = 0

export const RemeshState = <T>(options: RemeshStateOptions<T>): RemeshState<T> => {
  const stateId = stateUid++

  const State = (newState => {
    return {
      type: 'RemeshStatePayload',
      State,
      newState
    }
  }) as RemeshState<T>

  State.type = 'RemeshState'
  State.stateId = stateId
  State.stateName = options.name
  State.default = options.default
  State.compare = options.compare ?? shallowEqual

  return State
}

export type RemeshQueryContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshQuery<T = unknown> = {
  type: 'RemeshQuery'
  queryId: number
  queryName: string
  impl: (context: RemeshQueryContext) => T
  Domain?: RemeshDomain<any>
  compare: CompareFn<T>
}

export type RemeshQueryOptions<T> = {
  name: RemeshQuery<T>["queryName"]
  impl: RemeshQuery<T>["impl"]
  compare?: RemeshQuery<T>['compare']
}

let queryUid = 0
export const RemeshQuery = <T>(options: RemeshQueryOptions<T>): RemeshQuery<T> => {
  const queryId = queryUid++

  return {
    type: 'RemeshQuery',
    queryId: queryId,
    queryName: options.name,
    impl: options.impl,
    compare: options.compare ?? shallowEqual
  }
}

export type RemeshCommandContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshCommandOutput =
  | RemeshStatePayload<any>
  | RemeshEventPayload<any>
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
  Event: RemeshEvent<T>
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
  Command.Event = RemeshEvent<T>({
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
  | RemeshEventPayload<any>
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
  state: typeof RemeshState
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
    [key: string]: RemeshEvent<any> | RemeshDomainOutput['event']
  },
  query: {
    [key: string]: RemeshQuery<any> | RemeshDomainOutput['query']
  }
}

export type RemeshDomainWidgetOutput = {
  autorun: RemeshTask<void>[]
  event: {
    [key: string]: RemeshEvent<any> | RemeshDomainWidgetOutput['event']
  },
  query: {
    [key: string]: RemeshQuery<any> | RemeshDomainWidgetOutput['query']
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

type RemeshStateStorage<T = unknown> = {
  type: 'RemeshStateStorage'
  State: RemeshState<T>
  currentState: T
  downstreamSet: Set<RemeshQueryStorage<any>>
}

type RemeshQueryStorage<T = unknown> = {
  type: "RemeshQueryStorage"
  Query: RemeshQuery<T>
  currentValue: T
  upstreamSet: Set<RemeshQueryStorage<any> | RemeshStateStorage<any>>
  downstreamSet: Set<RemeshQueryStorage<any>>,
  subject: Subject<T>
  observable: Observable<T>
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
  upstreamSet: Set<RemeshDomainStorage<any>>
  downstreamSet: Set<RemeshDomainStorage<any>>
  autorunTaskSet: Set<RemeshTask<void>>
  subscriptionSet: Set<Subscription>
  stateMap: Map<RemeshState<any>, RemeshStateStorage<any>>
  queryMap: Map<RemeshQuery<any>, RemeshQueryStorage<any>>
  eventMap: Map<RemeshEvent<any>, RemeshEventStorage<any>>
  refCount: number
}

type RemeshTaskExternStorage<T, U = T> = {
  type: 'RemeshTaskExternStorage',
  Extern: RemeshTaskExtern<T, U>
  currentValue: U
}

export type RemeshQueryRef<T> = {
  drop: () => void
  get: () => T
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
  const dirtySet = new Set<RemeshQueryStorage<any>>()
  const domainStorageMap = new Map<RemeshDomain<any>, RemeshDomainStorage<any>>()
  const taskExternStorageMap = new Map<RemeshTaskExtern<any>, RemeshTaskExternStorage<any>>()

  const getInjectedExternValue = <T, U>(Extern: RemeshTaskExtern<T, U>): T => {
    for (const payload of options.externs ?? []) {
      if (payload.Extern === Extern) {
        return payload.value
      }
    }
    return Extern.default
  }

  const getTaskExternStorage = <T, U = T>(Extern: RemeshTaskExtern<T, U>): RemeshTaskExternStorage<T, U> => {
    const taskExternStorage = taskExternStorageMap.get(Extern)

    if (taskExternStorage) {
      return taskExternStorage
    }

    const getCurrentValue = (): U => {
      const injectedValue = getInjectedExternValue(Extern)
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

    const currentTaskExternStorage: RemeshTaskExternStorage<T, U> = {
      type: 'RemeshTaskExternStorage',
      Extern,
      currentValue: getCurrentValue()
    }

    taskExternStorageMap.set(Extern, currentTaskExternStorage)

    return getTaskExternStorage(Extern)
  }

  const getTaskExternCurrentValue = <T, U>(Extern: RemeshTaskExtern<T, U>): U => {
    return getTaskExternStorage(Extern).currentValue
  }

  const getStateStorage = <T>(State: RemeshState<T>): RemeshStateStorage<T> => {
    const domainsStorage = getDomainStorage(State.Domain ?? DefaultDomain)

    const stateStorage = domainsStorage.stateMap.get(State)

    if (stateStorage) {
      return stateStorage as RemeshStateStorage<T>
    }

    domainsStorage.stateMap.set(State, {
      type: 'RemeshStateStorage',
      State: State,
      currentState: State.default,
      downstreamSet: new Set()
    })

    return getStateStorage(State)
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
        if (currentEventStorage.refCount === 0) {
          clearEventStorageIfNeeded(currentEventStorage)
        }
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

  const getQueryStorage = <T>(Query: RemeshQuery<T>): RemeshQueryStorage<T> => {
    const domainStorage = getDomainStorage(Query.Domain ?? DefaultDomain)
    const queryStorage = domainStorage.queryMap.get(Query)

    if (queryStorage) {
      return queryStorage
    }

    const subject = new Subject<T>()

    const observable = new Observable<T>(subscriber => {
      const subscription = subject.subscribe(subscriber)
      currentQueryStorage.refCount += 1
      return () => {
        subscription.unsubscribe()
        currentQueryStorage.refCount -= 1
        if (currentQueryStorage.refCount === 0) {
          clearQueryStorageIfNeeded(currentQueryStorage)
        }
      }
    })

    const upstreamSet: RemeshQueryStorage<T>['upstreamSet'] = new Set()
    const downstreamSet: RemeshQueryStorage<T>['downstreamSet'] = new Set()

    const { impl } = Query

    const currentValue = impl({
      get: (input) => {
        if (input.type === 'RemeshQuery') {
          const upstreamQueryStorage = getQueryStorage(input)
          upstreamSet.add(upstreamQueryStorage)
        } else if (input.type === 'RemeshState') {
          const upstreamStateStorage = getStateStorage(input)
          upstreamSet.add(upstreamStateStorage)
        }
        return remeshInjectedContext.get(input)
      }
    })

    const currentQueryStorage: RemeshQueryStorage<T> = {
      type: 'RemeshQueryStorage',
      Query: Query,
      currentValue,
      upstreamSet,
      downstreamSet,
      subject,
      observable,
      refCount: 0
    }

    for (const upstream of upstreamSet) {
      upstream.downstreamSet.add(currentQueryStorage)
    }

    domainStorage.queryMap.set(Query, currentQueryStorage)

    return getQueryStorage(Query)
  }

  const getDomainStorage = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>): RemeshDomainStorage<T> => {
    const domainStorage = domainStorageMap.get(Domain)

    if (domainStorage) {
      return domainStorage
    }

    let isInit = false
    const throwIfIsInit = () => {
      if (isInit) {
        throw new Error(`Can not call domain.{method}(..) after domain has been initialized`)
      }
    }

    const upstreamSet: RemeshDomainStorage<T>['upstreamSet'] = new Set()
    const autorunTaskSet: RemeshDomainStorage<T>['autorunTaskSet'] = new Set()

    const domainContext: RemeshDomainContext = {
      state: options => {
        throwIfIsInit()
        const State = RemeshState(options)
        State.Domain = Domain
        return State
      },
      query: options => {
        throwIfIsInit()
        const Query = RemeshQuery(options)
        Query.Domain = Domain
        return Query
      },
      event: options => {
        throwIfIsInit()
        const Event = RemeshEvent(options)
        Event.Domain = Domain
        return Event
      },
      command: options => {
        throwIfIsInit()
        const Command = RemeshCommand(options)
        Command.Domain = Domain
        Command.Event.Domain = Domain
        return Command
      },
      task: options => {
        throwIfIsInit()
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
        throwIfIsInit()
        const { Widget, arg } = widgetPayload
        const widget = Widget.impl(domainContext, arg)

        for (const Task of widget.autorun ?? []) {
          autorunTaskSet.add(Task)
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
      upstreamSet,
      downstreamSet: new Set(),
      autorunTaskSet,
      subscriptionSet: new Set(),
      stateMap: new Map(),
      queryMap: new Map(),
      eventMap: new Map(),
      refCount: 0
    }

    domainStorageMap.set(Domain, currentDomainStorage)

    for (const upstreamDomainStorage of upstreamSet) {
      upstreamDomainStorage.downstreamSet.add(currentDomainStorage)
    }

    return getDomainStorage(Domain)
  }

  const clearQueryStorage = <T>(queryStorage: RemeshQueryStorage<T>) => {
    const domainStorage = getDomainStorage(queryStorage.Query.Domain ?? DefaultDomain)

    queryStorage.subject.complete()
    domainStorage.queryMap.delete(queryStorage.Query)

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


  const clearQueryStorageIfNeeded = <T>(queryStorage: RemeshQueryStorage<T>) => {
    if (queryStorage.refCount !== 0) {
      return
    }

    if (queryStorage.downstreamSet.size !== 0) {
      return
    }

    clearQueryStorage(queryStorage)
  }

  const clearStateStorage = <T>(stateStorage: RemeshStateStorage<T>) => {
    const domainStorage = getDomainStorage(stateStorage.State.Domain ?? DefaultDomain)

    domainStorage.stateMap.delete(stateStorage.State)
  }


  const clearStateStorageIfNeeded = <T>(stateStorage: RemeshStateStorage<T>) => {
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

    for (const subscription of domainStorage.subscriptionSet) {
      subscription.unsubscribe()
    }

    for (const eventStorage of domainStorage.eventMap.values()) {
      clearEventStorage(eventStorage)
    }

    for (const queryStorage of domainStorage.queryMap.values()) {
      clearQueryStorage(queryStorage)
    }

    for (const stateStorage of domainStorage.stateMap.values()) {
      clearStateStorage(stateStorage)
    }

    domainStorage.autorunTaskSet.clear()
    domainStorage.upstreamSet.clear()
    domainStorage.subscriptionSet.clear()
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

    clearDomainStorage(domainStorage)
  }

  const getCurrentState = <T>(State: RemeshState<T>): T => {
    const stateStorage = getStateStorage(State)

    return stateStorage.currentState
  }

  const getCurrentQueryValue = <T>(Query: RemeshQuery<T>): T => {
    const queryStorage = getQueryStorage(Query)

    return queryStorage.currentValue
  }

  const remeshInjectedContext: RemeshInjectedContext = {
    get: (input) => {
      if (input.type === 'RemeshState') {
        return getCurrentState(input)
      }

      if (input.type === 'RemeshQuery') {
        return getCurrentQueryValue(input)
      }

      throw new Error(`Unknown input in get(..): ${input}`)
    },
    fromTask: taskPayload => {
      const { Task, arg } = taskPayload
      const taskContext: RemeshTaskContext = {
        fromTask: remeshInjectedContext.fromTask,
        fromEvent: remeshInjectedContext.fromEvent,
        getExtern: getTaskExternCurrentValue
      }
      const observable = Task.impl(taskContext, arg)
      return observable
    },
    fromEvent: Event => {
      const eventStorage = getEventStorage(Event)
      return eventStorage.observable
    }
  }

  const updateQueryStorage = <T>(queryStorage: RemeshQueryStorage<T>) => {
    const { Query } = queryStorage

    for (const upstream of queryStorage.upstreamSet) {
      upstream.downstreamSet.delete(queryStorage)
    }

    queryStorage.upstreamSet.clear()

    const newValue = Query.impl({
      get: (input) => {
        if (input.type === 'RemeshQuery') {
          const upstreamQueryStorage = getQueryStorage(input)
          queryStorage.upstreamSet.add(upstreamQueryStorage)
          upstreamQueryStorage.downstreamSet.add(queryStorage)
        } else if (input.type === 'RemeshState') {
          const upstreamStateStorage = getStateStorage(input)
          queryStorage.upstreamSet.add(upstreamStateStorage)
          upstreamStateStorage.downstreamSet.add(queryStorage)
        }
        return remeshInjectedContext.get(input)
      }
    })

    const isEqual = queryStorage.Query.compare(queryStorage.currentValue, newValue)

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

  const clearDirtySet = () => {
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
    clearDirtySet()
  }

  let tid: ReturnType<typeof setTimeout>
  const notify = () => {
    clearTimeout(tid)
    tid = setTimeout(clearDirtySet, 0)
  }

  const handleStatePayload = (data: RemeshStatePayload) => {
    const { State, newState } = data
    const stateStorage = getStateStorage(State)

    const isEqual = State.compare(stateStorage.currentState, newState)

    if (isEqual) {
      return
    }

    stateStorage.currentState = newState

    /**
     * updateQueryStorage may update upstream.downstreamSet
     * so it should be converted to an array for avoiding infinite loop
     */
    for (const downstream of [...stateStorage.downstreamSet]) {
      updateQueryStorage(downstream)
    }

    notify()
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
    } else if (commandOutput.type === 'RemeshStatePayload') {
      handleStatePayload(commandOutput)
      return
    }

    throw new Error(`Unknown command output of ${commandOutput}`)
  }

  const handleCommandPayload = <T>(commandPayload: RemeshCommandPayload<T>) => {
    const { Command, arg } = commandPayload
    const commandContext = {
      get: remeshInjectedContext.get
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

  const handleTaskPayload = <T>(taskPayload: RemeshTaskPayload<T>) => {
    const taskOutput$ = remeshInjectedContext.fromTask(taskPayload)
    const domainStorage = getDomainStorage(taskPayload.Task.Domain ?? DefaultDomain)

    const subscription = taskOutput$.subscribe(handleTaskOutput)

    handleSubscription(domainStorage.subscriptionSet, subscription)

    return subscription
  }

  const subscribeQuery = <T>(Query: RemeshQuery<T>, subscriber: (data: T) => unknown): Subscription => {
    const queryStorage = getQueryStorage(Query)
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
    return extractDomain(domainStorage.domain)
  }

  const domainSubscriptionSet = new Set<Subscription>()

  const subscribeDomain = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>): Subscription => {
    const domainStorage = getDomainStorage(Domain)
    const subscription = new Subscription()

    domainSubscriptionSet.add(subscription)

    domainStorage.refCount += 1

    subscription.add(() => {
      domainStorage.refCount -= 1
      domainSubscriptionSet.delete(subscription)
      clearDomainStorageIfNeeded(domainStorage)

    })

    if (domainStorage.refCount === 1) {
      for (const upstreamDomainStorage of domainStorage.upstreamSet) {
        const upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.Domain)
        domainStorage.subscriptionSet.add(upstreamDomainSubscription)
      }

      for (const Task of domainStorage.autorunTaskSet) {
        handleTaskPayload(Task())
      }
    }

    return subscription
  }

  const destroy = () => {
    clearTimeout(tid)
    for (const subscription of domainSubscriptionSet) {
      subscription.unsubscribe()
    }
    clearDomainStorageIfNeeded(getDomainStorage(DefaultDomain))
    domainSubscriptionSet.clear()
    domainStorageMap.clear()
    dirtySet.clear()
  }

  const createQueryRef = <T>(Query: RemeshQuery<T>): RemeshQueryRef<T> => {
    const queryStorage = getQueryStorage(Query)
    let isDropped = false

    queryStorage.refCount += 1

    return {
      drop: () => {
        if (isDropped) {
          return
        }
        isDropped = true
        queryStorage.refCount -= 1
        if (queryStorage.refCount === 0) {
          clearQueryStorageIfNeeded(queryStorage)
        }
      },
      get: () => {
        if (isDropped) {
          throw new Error(`Unexpected calling queryRef.get() after queryRef was dropped!`)
        }
        return getCurrentQueryValue(Query)
      }
    }
  }

  return {
    name: options.name,
    createQueryRef,
    emit: handleEventPayload,
    getDomain,
    destroy,
    subscribeTask: handleTaskPayload,
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