import { Observable, Subject, Subscription } from "rxjs"

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

export type RemeshState<T> = {
  type: 'RemeshState'
  stateId: number
  stateName: string
  default: T
  (newState: T): RemeshStatePayload<T>
  Domain?: RemeshDomain<any>
}

export type RemeshStatePayload<T = unknown> = {
  type: 'RemeshStatePayload',
  State: RemeshState<T>
  newState: T
}

export type RemeshStateOptions<T> = {
  name: RemeshState<T>['stateName']
  default: RemeshState<T>['default']
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
}

export type RemeshQueryOptions<T> = {
  name: RemeshQuery<T>["queryName"]
  impl: RemeshQuery<T>["impl"]
}

let queryUid = 0
export const RemeshQuery = <T>(options: RemeshQueryOptions<T>): RemeshQuery<T> => {
  const queryId = queryUid++

  return {
    type: 'RemeshQuery',
    queryId: queryId,
    queryName: options.name,
    impl: options.impl
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

  return Command
}

export type RemeshTaskContext = {
  fromEvent: RemeshInjectedContext['fromEvent']
  fromTask: RemeshInjectedContext['fromTask']
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

export type RemeshDomainExtract<T extends RemeshDomainDefinition> = Pick<T, 'query' | 'event' | 'command' | 'task'>

export type RemeshDomainContext = {
  get: <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>) => RemeshDomainExtract<T>
  state: typeof RemeshState
  event: typeof RemeshEvent
  query: typeof RemeshQuery
  command: typeof RemeshCommand
  task: typeof RemeshTask
}

export type RemeshDomainOutput = {
  autorun: RemeshTask<void>[]
  event: {
    [key: string]: RemeshEvent<any> | RemeshDomainOutput['event']
  },
  query: {
    [key: string]: RemeshQuery<any> | RemeshDomainOutput['query']
  },
  command: {
    [key: string]: RemeshCommand<any> | RemeshDomainOutput['command']
  },
  task: {
    [key: string]: RemeshTask<any> | RemeshDomainOutput['task']
  }
}

export type RemeshDomainDefinition = Partial<RemeshDomainOutput>

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
}

type RemeshEventStorage<T = unknown, U = T> = {
  type: "RemeshEventStorage"
  Event: RemeshEvent<T, U>
  subject: Subject<U>
  observable: Observable<U>
}

type RemeshDomainStorage<T extends RemeshDomainDefinition> = {
  type: 'RemeshDomainStorage'
  Domain: RemeshDomain<T>
  domain: T
  upstreamSet: Set<RemeshDomainStorage<any>>
  downstreamSet: Set<RemeshDomainStorage<any>>
  stateMap: Map<RemeshState<any>, RemeshStateStorage<any>>
  queryMap: Map<RemeshQuery<any>, RemeshQueryStorage<any>>
  eventMap: Map<RemeshEvent<any>, RemeshEventStorage<any>>
  subscriptionSet: Set<Subscription>
  refCount: number
}

export type RemeshStoreOptions = {
  name: string
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
    const observable = subject.asObservable()

    domainStorage.eventMap.set(Event, {
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable
    })

    return getEventStorage(Event)
  }

  const getQueryStorage = <T>(Query: RemeshQuery<T>): RemeshQueryStorage<T> => {
    const domainStorage = getDomainStorage(Query.Domain ?? DefaultDomain)
    const queryStorage = domainStorage.queryMap.get(Query)

    if (queryStorage) {
      return queryStorage
    }

    const subject = new Subject<T>()

    const observable = subject.asObservable()

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
      observable
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

    const upstreamSet: RemeshDomainStorage<T>['upstreamSet'] = new Set()

    const domainContext: RemeshDomainContext = {
      state: options => {
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

        return {
          query: domain.query,
          command: domain.command,
          event: domain.event,
          task: domain.task
        }
      }
    }

    const domain = Domain.impl(domainContext)

    const currentDomainStorage: RemeshDomainStorage<T> = {
      type: 'RemeshDomainStorage',
      Domain,
      domain,
      upstreamSet,
      downstreamSet: new Set(),
      stateMap: new Map(),
      queryMap: new Map(),
      eventMap: new Map(),
      subscriptionSet: new Set(),
      refCount: 0
    }

    domainStorageMap.set(Domain, currentDomainStorage)

    for (const upstreamDomainStorage of upstreamSet) {
      upstreamDomainStorage.downstreamSet.add(currentDomainStorage)
    }

    return getDomainStorage(Domain)
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

      throw new Error(`Unknown input in queryContext.get(..): ${input}`)
    },
    fromTask: taskPayload => {
      const { Task, arg } = taskPayload
      const taskContext: RemeshTaskContext = {
        fromTask: remeshInjectedContext.fromTask,
        fromEvent: remeshInjectedContext.fromEvent
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

    if (queryStorage.currentValue === newValue) {
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

    if (stateStorage.currentState === newState) {
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
    const domainStorage = getDomainStorage(Query.Domain ?? DefaultDomain)

    handleSubscription(domainStorage.subscriptionSet, subscription)

    return subscription
  }

  const subscribeEvent = <T, U = T>(Event: RemeshEvent<T, U>, subscriber: (event: U) => unknown) => {
    const eventStorage = getEventStorage(Event)
    const subscription = eventStorage.observable.subscribe(subscriber)
    const domainStorage = getDomainStorage(Event.Domain ?? DefaultDomain)

    handleSubscription(domainStorage.subscriptionSet, subscription)

    return subscription
  }

  const getDomain = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>): T => {
    const domainStorage = getDomainStorage(Domain)
    return domainStorage.domain
  }

  const clearDomainResourcesIfNeeded = <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>) => {
    const domainStorage = getDomainStorage(Domain)

    if (domainStorage.refCount !== 0) {
      return
    }

    if (domainStorage.downstreamSet.size !== 0) {
      return
    }

    for (const subscription of domainStorage.subscriptionSet) {
      subscription.unsubscribe()
    }

    for (const upstreamDomainStorage of domainStorage.upstreamSet) {
      upstreamDomainStorage.downstreamSet.delete(domainStorage)
      clearDomainResourcesIfNeeded(upstreamDomainStorage.Domain)
    }

    domainStorage.upstreamSet.clear()
    domainStorage.subscriptionSet.clear()
    domainStorage.stateMap.clear()
    domainStorage.queryMap.clear()
    domainStorage.eventMap.clear()
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
      clearDomainResourcesIfNeeded(Domain)

    })

    if (domainStorage.refCount === 1) {
      for (const upstreamDomainStorage of domainStorage.upstreamSet) {
        const upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.Domain)
        domainStorage.subscriptionSet.add(upstreamDomainSubscription)
      }

      for (const Task of domainStorage.domain.autorun ?? []) {
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
    clearDomainResourcesIfNeeded(DefaultDomain)
    domainSubscriptionSet.clear()
    domainStorageMap.clear()
    dirtySet.clear()
  }

  return {
    name: options.name,
    query: getCurrentQueryValue,
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
  store: RemeshStore
}
