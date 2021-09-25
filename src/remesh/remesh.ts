import { Observable, Subject, Subscription, Observer } from "rxjs"

import { shareReplay } from "rxjs/operators"

export type RemeshEvent<T = unknown> = {
  type: "RemeshEvent"
  eventId: number
  eventName: string
  match(input: any): input is RemeshEventPayload<T>
  getData: (eventPayload: RemeshEventPayload<T>) => T
  (data: T): RemeshEventPayload<T>
}

export type RemeshEventPayload<T = unknown> = {
  type: "RemeshEventPayload"
  data: T
  Event: RemeshEvent<T>
}

export type RemeshEventOptions = {
  name: string
}

let eventUid = 0

export const RemeshEvent = <T = void>(
  options: RemeshEventOptions
): RemeshEvent<T> => {
  const eventId = eventUid++

  const Event = ((data) => {
    return {
      type: "RemeshEventPayload",
      data,
      Event: Event,
    }
  }) as RemeshEvent<T>

  Event.type = 'RemeshEvent'
  Event.eventId = eventId
  Event.eventName = options.name

  Event.match = (input): input is RemeshEventPayload<T> => {
    return input?.type === 'RemeshEventPayload' && input?.Event === Event
  }

  Event.getData = (eventPayload) => {
    return eventPayload.data
  }

  return Event
}

export type RemeshStateChangedEventData<T = unknown> = {
  type: 'RemeshStateChangedEventData',
  State: RemeshState<T>
  newState: T
}

export const isRemeshStateChangedEventData = <T>(input: any): input is RemeshStateChangedEventData<T> => {
  return input?.type === 'RemeshStateChangedEventData'
}

export type RemeshState<T> = {
  type: 'RemeshState'
  stateId: number
  stateName: string
  default: T
  events: {
    StateChanged: RemeshEvent<RemeshStateChangedEventData<T>>
  }
  (newState: T): RemeshEventPayload<RemeshStateChangedEventData<T>>
}

export type RemeshStateOptions<T> = {
  name: RemeshState<T>['stateName']
  default: RemeshState<T>['default']
}

let stateUid = 0

export const RemeshState = <T>(options: RemeshStateOptions<T>): RemeshState<T> => {
  const stateId = stateUid++

  const StateChanged = RemeshEvent<RemeshStateChangedEventData<T>>({
    name: `StateChanged(${options.name})`
  })

  const State = (newState => {
    return StateChanged({
      type: 'RemeshStateChangedEventData',
      State,
      newState
    })
  }) as RemeshState<T>

  State.type = 'RemeshState'
  State.stateId = stateId
  State.stateName = options.name
  State.default = options.default
  State.events = {
    StateChanged
  }

  return State
}

type RemeshInjectedContext = {
  get: <T>(State: RemeshState<T> | RemeshQuery<T>) => T
  fromEvent: <T>(Event: RemeshEvent<T>) => Observable<T>
  fromAggregate: <T>(Aggregate: RemeshAggregatePayload<T>) => Observable<RemeshCommandPayload<any>>
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

let queryUid = 0

export type RemeshQueryOptions<T> = {
  name: RemeshQuery<T>["queryName"]
  impl: RemeshQuery<T>["impl"]
}

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

export type RemeshCommandOutput = RemeshEventPayload<any> | RemeshCommandOutput[]

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

let aggregateUid = 0

export type RemeshAggregatePayload<T> = {
  type: "RemeshAggregatePayload"
  arg: T
  Aggregate: RemeshAggregate<T>
}

export type RemeshAggregate<T> = {
  type: "RemeshAggregate"
  aggregateId: number
  aggregateName: string
  impl: (context: RemeshAggregateContext, arg: T) => Observable<RemeshCommandPayload<any>>
  (arg: T): RemeshAggregatePayload<T>
}

export type RemeshAggregateOptions<T> = {
  name: RemeshAggregate<T>["aggregateName"]
  impl: RemeshAggregate<T>["impl"]
}

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
  isOutDated: boolean
  subject: Subject<T>
  observable: Observable<T>
}

type RemeshEventStorage<T = unknown> = {
  type: "RemeshEventStorage"
  Event: RemeshEvent<T>
  subject: Subject<T>
  observable: Observable<T>
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

  const getEventStorage = <T>(Event: RemeshEvent<T>): RemeshEventStorage<T> => {
    const eventStorage = storage.eventMap.get(Event)

    if (eventStorage) {
      return eventStorage as RemeshEventStorage<T>
    }

    const subject = new Subject<T>()
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

    const observable = subject.pipe(shareReplay({
      refCount: true,
      bufferSize: 1,
    }))

    const upstreamSet: RemeshQueryStorage<T>['upstreamSet'] = new Set()
    const downstreamSet: RemeshQueryStorage<T>['downstreamSet'] = new Set()

    const { impl } = Query

    const currentValue = impl({
      get: (input) => {
        if (input.type === 'RemeshQuery') {
          const queryStorage = getQueryStorage(input)
          upstreamSet.add(queryStorage)
        } else if (input.type === 'RemeshState') {
          const stateStorage = getStateStorage(input)
          upstreamSet.add(stateStorage)
        }
        return remeshInjectedContext.get(input)
      }
    })

    subject.next(currentValue)

    const currentQueryStorage: RemeshQueryStorage<T> = {
      type: 'RemeshQueryStorage',
      Query: Query,
      currentValue,
      upstreamSet,
      downstreamSet,
      isOutDated: false,
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

    if (queryStorage.isOutDated) {
      updateQueryStorage(queryStorage)
    }

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
      const observable = Aggregate.impl({
        fromAggregate: remeshInjectedContext.fromAggregate,
        fromEvent: remeshInjectedContext.fromEvent
      }, arg)

      return observable
    },
    fromEvent: Event => {
      const eventStorage = getEventStorage(Event)

      return eventStorage.observable
    }
  }

  const updateQueryStorage = <T>(queryStorage: RemeshQueryStorage<T>) => {
    if (!queryStorage.isOutDated) {
      return
    }

    const { impl } = queryStorage.Query
    const oldValue = queryStorage.currentValue

    const oldUpstreamSet = queryStorage.upstreamSet
    const oldDownstreamSet = queryStorage.downstreamSet

    queryStorage.downstreamSet = new Set()
    queryStorage.upstreamSet = new Set()

    for (const upstream of oldUpstreamSet) {
      upstream.downstreamSet.delete(queryStorage)
    }

    const newValue = impl({
      get: (input) => {
        if (input.type === 'RemeshQuery') {
          const targetQueryStorage = getQueryStorage(input)
          queryStorage.upstreamSet.add(targetQueryStorage)
          targetQueryStorage.downstreamSet.add(queryStorage)
        } else if (input.type === 'RemeshState') {
          const targetStateStorage = getStateStorage(input)
          queryStorage.upstreamSet.add(targetStateStorage)
          targetStateStorage.downstreamSet.add(queryStorage)
        }
        return remeshInjectedContext.get(input)
      }
    })

    queryStorage.currentValue = newValue
    queryStorage.isOutDated = false

    if (oldValue === newValue) {
      return
    }

    queryStorage.subject.next(newValue)

    for (const downstream of oldDownstreamSet) {
      updateQueryStorage(downstream)
    }
  }

  const markDirty = <T>(queryStorage: RemeshQueryStorage<T>) => {
    if (queryStorage.isOutDated) {
      return
    }

    queryStorage.isOutDated = true
    storage.dirtySet.add(queryStorage)

    for (const downstream of queryStorage.downstreamSet) {
      markDirty(downstream)
    }
  }

  const handleStateChangedEventData = (data: RemeshStateChangedEventData) => {
    const { State, newState } = data
    const stateStorage = getStateStorage(State)
    const oldState = stateStorage.currentState

    if (oldState === newState) {
      return
    }

    stateStorage.currentState = newState

    for (const downstream of stateStorage.downstreamSet) {
      markDirty(downstream)
    }

    for (const downstream of stateStorage.downstreamSet) {
      updateQueryStorage(downstream)
    }
  }

  const handleEventPayload = <T>(eventPayload: RemeshEventPayload<T>) => {
    const { Event, data } = eventPayload
    const eventStorage = getEventStorage(Event)

    if (isRemeshStateChangedEventData(data)) {
      handleStateChangedEventData(data)
    }

    eventStorage.subject.next(data)
  }

  const handleCommandOutput = (commandOutput: RemeshCommandOutput) => {
    if (Array.isArray(commandOutput)) {
      for (const item of commandOutput) {
        handleCommandOutput(item)
      }
      return
    }

    handleEventPayload(commandOutput)
  }

  const handleAggregatePayload = <T>(aggregatePayload: RemeshAggregatePayload<T>) => {
    const commandPayload$ = remeshInjectedContext.fromAggregate(aggregatePayload)
    const subscription = commandPayload$.subscribe({
      next: commandPayload => {
        const { Command, arg } = commandPayload
        const commandOutput = Command.impl({
          get: remeshInjectedContext.get
        }, arg)

        handleCommandOutput(commandOutput)
      }
    })

    storage.subscriptionSet.add(subscription)

    subscription.add(() => {
      storage.subscriptionSet.delete(subscription)
    })

    return () => {
      subscription.unsubscribe()
    }
  }

  const fromQuery = <T>(Query: RemeshQuery<T>): Observable<T> => {
    const queryStorage = getQueryStorage(Query)
    return queryStorage.observable
  }

  return {
    name: options.name,
    emit: handleEventPayload,
    fromQuery,
    fromEvent: remeshInjectedContext.fromEvent,
    useAggregate: handleAggregatePayload,
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
