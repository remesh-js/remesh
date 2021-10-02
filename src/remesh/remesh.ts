import { Observable, Subject, Subscription } from "rxjs"

import { shareReplay } from "rxjs/operators"

type RemeshInjectedContext = {
  get: <T>(State: RemeshState<T> | RemeshQuery<T>) => T
  fromEvent: <T, U = T>(Event: RemeshEvent<T, U>) => Observable<U>
  fromAggregate: <T>(Aggregate: RemeshAggregatePayload<T>) => Observable<RemeshAggregateOutput>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshEvent<T = unknown, U = T> = {
  type: "RemeshEvent"
  eventId: number
  eventName: string
  impl?: (arg: T, context: RemeshEventContext) => U
  (arg: T): RemeshEventPayload<T, U>
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
  impl: (arg: T, context: RemeshCommandContext) => RemeshCommandOutput
  (arg: T): RemeshCommandPayload<T>
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

export type RemeshAggregateContext = {
  fromEvent: RemeshInjectedContext['fromEvent']
  fromAggregate: RemeshInjectedContext['fromAggregate']
}

export type RemeshAggregatePayload<T> = {
  type: "RemeshAggregatePayload"
  arg: T
  Aggregate: RemeshAggregate<T>
}

export type RemeshAggregateOutput =
  | RemeshCommandPayload<any>
  | RemeshEventPayload<any>
  | RemeshAggregateOutput[]

export type RemeshAggregate<T> = {
  type: "RemeshAggregate"
  aggregateId: number
  aggregateName: string
  impl: (context: RemeshAggregateContext, arg: T) => Observable<RemeshAggregateOutput>
  (arg: T): RemeshAggregatePayload<T>
}

export type RemeshAggregateOptions<T> = {
  name: RemeshAggregate<T>["aggregateName"]
  impl: RemeshAggregate<T>["impl"]
}
let aggregateUid = 0

export const RemeshAggregate = <T = void>(
  options: RemeshAggregateOptions<T>
): RemeshAggregate<T> => {
  const aggregateId = aggregateUid++

  const Aggregate = ((arg) => {
    return {
      type: "RemeshAggregatePayload",
      arg,
      Aggregate: Aggregate,
    }
  }) as RemeshAggregate<T>

  Aggregate.type = 'RemeshAggregate'
  Aggregate.aggregateId = aggregateId
  Aggregate.aggregateName = options.name
  Aggregate.impl = options.impl

  return Aggregate
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

type RemeshStoreInternalStorage = {
  stateMap: Map<RemeshState<any>, RemeshStateStorage<any>>
  queryMap: Map<RemeshQuery<any>, RemeshQueryStorage<any>>
  eventMap: Map<RemeshEvent<any>, RemeshEventStorage<any>>
  dirtySet: Set<RemeshQueryStorage<any>>
  subscriptionSet: Set<Subscription>
}

export type RemeshStoreOptions = {
  name: string
}

export const RemeshStore = (options: RemeshStoreOptions) => {
  const storage: RemeshStoreInternalStorage = {
    stateMap: new Map(),
    queryMap: new Map(),
    eventMap: new Map(),
    subscriptionSet: new Set(),
    dirtySet: new Set()
  }

  const getStateStorage = <T>(State: RemeshState<T>): RemeshStateStorage<T> => {
    const stateStorage = storage.stateMap.get(State)

    if (stateStorage) {
      return stateStorage as RemeshStateStorage<T>
    }

    storage.stateMap.set(State, {
      type: 'RemeshStateStorage',
      State: State,
      currentState: State.default,
      downstreamSet: new Set()
    })

    return getStateStorage(State)
  }

  const getEventStorage = <T, U = T>(Event: RemeshEvent<T, U>): RemeshEventStorage<T, U> => {
    const eventStorage = storage.eventMap.get(Event)

    if (eventStorage) {
      return eventStorage as RemeshEventStorage<T, U>
    }

    const subject = new Subject<U>()
    const observable = subject.asObservable()

    storage.eventMap.set(Event, {
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable
    })

    return getEventStorage(Event)
  }

  const getQueryStorage = <T>(Query: RemeshQuery<T>): RemeshQueryStorage<T> => {
    const queryStorage = storage.queryMap.get(Query)

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

    storage.queryMap.set(Query, currentQueryStorage)

    return getQueryStorage(Query)
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
    fromAggregate: aggregatePayload => {
      const { Aggregate, arg } = aggregatePayload
      const aggregateContext = {
        fromAggregate: remeshInjectedContext.fromAggregate,
        fromEvent: remeshInjectedContext.fromEvent
      }
      const observable = Aggregate.impl(aggregateContext, arg)
      return observable
    },
    fromEvent: Event => {
      const eventStorage = getEventStorage(Event)

      return eventStorage.observable
    }
  }

  const updateQueryStorage = <T>(queryStorage: RemeshQueryStorage<T>) => {
    const { impl } = queryStorage.Query

    for (const upstream of queryStorage.upstreamSet) {
      upstream.downstreamSet.delete(queryStorage)
    }

    queryStorage.upstreamSet.clear()

    const newValue = impl({
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

    storage.dirtySet.add(queryStorage)

    /**
     * updateQueryStorage may update upstream.downstreamSet
     * so it should be converted to an array for avoiding infinite loop
     */
    for (const downstream of [...queryStorage.downstreamSet]) {
      updateQueryStorage(downstream)
    }
  }

  const clearDirtySet = () => {
    if (storage.dirtySet.size === 0) {
      return
    }

    const queryStorageList = [...storage.dirtySet]

    storage.dirtySet.clear()

    for (const queryStorage of queryStorageList) {
      if (!storage.dirtySet.has(queryStorage)) {
        queryStorage.subject.next(queryStorage.currentValue)
      }
    }

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

    for (const downstream of [...stateStorage.downstreamSet]) {
      updateQueryStorage(downstream)
    }

    notify()
  }

  const handleEventPayload = <T, U = T>(eventPayload: RemeshEventPayload<T, U>) => {
    const { Event, arg } = eventPayload
    const eventStorage = getEventStorage(Event)

    const eventContext = {
      get: remeshInjectedContext.get
    }

    if (Event.impl) {
      const data = Event.impl(arg, eventContext)
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
    const commandOutput = Command.impl(arg, {
      get: remeshInjectedContext.get
    })

    handleCommandOutput(commandOutput)
  }

  const handleSubscription = (subscription: Subscription) => {
    storage.subscriptionSet.add(subscription)

    subscription.add(() => {
      storage.subscriptionSet.delete(subscription)
    })
  }

  const handleAggregateOutput = (aggregateOutput: RemeshAggregateOutput) => {
    if (Array.isArray(aggregateOutput)) {
      for (const item of aggregateOutput) {
        handleAggregateOutput(item)
      }
      return
    }

    if (aggregateOutput.type === 'RemeshCommandPayload') {
      handleCommandOutput(aggregateOutput)
      return
    } else if (aggregateOutput.type === 'RemeshEventPayload') {
      handleEventPayload(aggregateOutput)
      return
    }

    throw new Error(`Unknown aggregate output of ${aggregateOutput}`)
  }

  const handleAggregatePayload = <T>(aggregatePayload: RemeshAggregatePayload<T>) => {
    const aggregateOutput$ = remeshInjectedContext.fromAggregate(aggregatePayload)
    const subscription = aggregateOutput$.subscribe(handleAggregateOutput)

    handleSubscription(subscription)

    return subscription
  }

  const subscribeQuery = <T>(Query: RemeshQuery<T>, subscriber: (data: T) => unknown): Subscription => {
    const queryStorage = getQueryStorage(Query)
    const subscription = queryStorage.observable.subscribe(subscriber)

    handleSubscription(subscription)

    return subscription
  }

  const subscribeEvent = <T, U = T>(Event: RemeshEvent<T, U>, subscriber: (event: U) => unknown) => {
    const eventStorage = getEventStorage(Event)
    const subscription = eventStorage.observable.subscribe(subscriber)

    handleSubscription(subscription)

    return subscription
  }

  const destroy = () => {
    clearTimeout(tid)
    for (const subscription of storage.subscriptionSet) {
      subscription.unsubscribe()
    }
    storage.subscriptionSet.clear()
    storage.stateMap.clear()
    storage.queryMap.clear()
    storage.eventMap.clear()
    storage.dirtySet.clear()
  }

  return {
    name: options.name,
    query: getCurrentQueryValue,
    emit: handleEventPayload,
    destroy,
    subscribeAggregate: handleAggregatePayload,
    subscribeQuery,
    subscribeEvent,
  }
}


export const Remesh = {
  state: RemeshState,
  query: RemeshQuery,
  command: RemeshCommand,
  event: RemeshEvent,
  aggregate: RemeshAggregate,
  store: RemeshStore
}
