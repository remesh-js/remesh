import { Observable, Subject, Subscription, Observer } from "rxjs"

import { shareReplay } from "rxjs/operators"

let remeshUid = 0

export type RemeshRepo<
  T extends object = object
  > = {
    type: "RemeshRepo"
    repoId: number
    repoName: string
    idKey: keyof T
    defaultEntities?: T[]
    add: (...entities: T[]) => RemeshEventPayload<RemeshRepoAddedEventData<T>>
    update: (...entities: T[]) => RemeshEventPayload<RemeshRepoUpdatedEventData<T>>
    remove: (...entities: T[]) => RemeshEventPayload<RemeshRepoRemovedEventData<T>>
    replace: (...entities: T[]) => RemeshEventPayload<RemeshRepoReplacedEventData<T>>
  }

export type RemeshRepoAddedEventData<T extends object = object> = {
  type: 'RemeshRepoAddedEvent'
  Repo: RemeshRepo<T>,
  entitiesWillAdd: T[]
}

export type RemeshRepoUpdatedEventData<T extends object = object> = {
  type: 'RemeshRepoUpdatedEventData'
  Repo: RemeshRepo<T>,
  entitiesWillUpdate: T[]
}

export type RemeshRepoRemovedEventData<T extends object = object> = {
  type: 'RemeshRepoRemovedEventData'
  Repo: RemeshRepo<T>,
  entitiesWillRemove: T[]
}

export type RemeshRepoReplacedEventData<T extends object = object> = {
  type: 'RemeshRepoReplacedEventData'
  Repo: RemeshRepo<T>,
  entitiesWillReplace: T[]
}

const isRemeshRepoAddedEventData = <T extends object>(input: any): input is RemeshRepoAddedEventData<T> => {
  return input.type === 'RemeshRepoAddedEventData'
}

const isRemeshRepoUpdatedEventData = <T extends object>(input: any): input is RemeshRepoUpdatedEventData<T> => {
  return input.type === 'RemeshRepoUpdatedEventData'
}

const isRemeshRepoRemovedEventData = <T extends object>(input: any): input is RemeshRepoRemovedEventData<T> => {
  return input.type === 'RemeshRepoRemovedEventData'
}

const isRemeshRepoReplacedEventData = <T extends object>(input: any): input is RemeshRepoReplacedEventData<T> => {
  return input.type === 'RemeshRepoReplacedEventData'
}


let repoUid = 0

export type RemeshRepoOptions<T extends object> = {
  repoName: RemeshRepo<T>["repoName"]
  idKey: RemeshRepo<T>["idKey"]
  defaultEntities?: RemeshRepo<T>['defaultEntities']
}

export const RemeshRepo = <T extends object>(
  options: RemeshRepoOptions<T>
): RemeshRepo<T> => {
  const repoId = repoUid++

  const events = {
    add: RemeshEvent<RemeshRepoAddedEventData<T>>({
      eventName: `@repo/${options.repoName}/added`,
    }),
    update: RemeshEvent<RemeshRepoUpdatedEventData<T>>({
      eventName: `@repo/${options.repoName}/updated`,
    }),
    remove: RemeshEvent<RemeshRepoRemovedEventData<T>>({
      eventName: `@repo/${options.repoName}/removed`,
    }),
    replace: RemeshEvent<RemeshRepoReplacedEventData<T>>({
      eventName: `@repo/${options.repoName}/replaced`,
    }),
  }

  const Repo: RemeshRepo<T> = {
    type: "RemeshRepo",
    repoId,
    repoName: options.repoName,
    idKey: options.idKey,
    defaultEntities: options.defaultEntities,
    add: (...entities) => {
      return events.add({
        type: 'RemeshRepoAddedEvent',
        Repo,
        entitiesWillAdd: entities
      })
    },
    update: (...entities) => {
      return events.update({
        type: 'RemeshRepoUpdatedEventData',
        Repo,
        entitiesWillUpdate: entities
      })
    },
    remove: (...entities) => {
      return events.remove({
        type: 'RemeshRepoRemovedEventData',
        Repo,
        entitiesWillRemove: entities
      })
    },
    replace: (...entities) => {
      return events.replace({
        type: 'RemeshRepoReplacedEventData',
        Repo,
        entitiesWillReplace: entities
      })
    }
  }

  return Repo
}

export type RemeshQueryContext = {
  get: <T extends object>(Repo: RemeshRepo<T>) => T[]
  select: <T extends object>(
    Repo: RemeshRepo<T>,
    predicateFn: (data: T) => boolean
  ) => T[]
  query: <T>(queryPayload: RemeshQueryPayload<unknown, T>) => T
}

export type RemeshQuery<Arg = unknown, T = unknown> = {
  type: 'RemeshQuery'
  queryId: number
  queryName: string
  impl: (arg: Arg) => (context: RemeshQueryContext) => T
  (arg: Arg): RemeshQueryPayload<Arg, T>
}

export type RemeshQueryPayload<Arg, T> = {
  type: 'RemeshQueryPayload'
  Query: RemeshQuery<Arg, T>
  arg: Arg
}

let queryUid = 0

export type RemeshQueryOptions<Arg, T> = {
  queryName: RemeshQuery<Arg, T>["queryName"]
  impl: RemeshQuery<Arg, T>["impl"]
}

export const RemeshQuery = <Arg, T>(options: RemeshQueryOptions<Arg, T>): RemeshQuery<Arg, T> => {
  const queryId = queryUid++

  const query = ((arg) => {
    return {
      type: 'RemeshQueryPayload',
      Query: query,
      arg
    }
  }) as RemeshQuery<Arg, T>

  query.queryId = queryId
  query.queryName = options.queryName
  query.impl = options.impl

  return query
}

export type RemeshEvent<T = unknown> = {
  type: "RemeshEvent"
  eventId: number
  eventName: string
  (data: T): RemeshEventPayload<T>
}

export type RemeshEventPayload<T = unknown> = {
  type: "RemeshEventPayload"
  data: T
  Event: RemeshEvent<T>
}

export type RemeshEventOptions = {
  eventName: string
}

let eventUid = 0

export const RemeshEvent = <T>(
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

  Event.eventId = eventId
  Event.eventName = options.eventName

  return Event
}

export type RemeshBehaviorContext = {
  get: RemeshQueryContext["get"]
  select: RemeshQueryContext["select"]
  query: RemeshQueryContext["query"]
}

export type RemeshBehaviorOutput = RemeshEventPayload | RemeshBehaviorOutput[]

export type RemeshBehaviorPayload<T extends unknown[] = unknown[]> = {
  type: "RemeshBehaviorPayload"
  args: T
  Behavior: RemeshBehavior<T>
}

export type RemeshBehavior<T extends unknown[]> = {
  type: "RemeshBehavior"
  behaviorId: number
  behaviorName: string
  impl: (...args: T) => (context: RemeshBehaviorContext) => RemeshBehaviorOutput
  (...args: T): RemeshBehaviorPayload<T>
}

export type RemeshBehaviorOptions<T extends unknown[]> = {
  behaviorName: RemeshBehavior<T>["behaviorName"]
  impl: RemeshBehavior<T>["impl"]
}

let behaviorUid = 0

export const RemeshBehavior = <T extends unknown[]>(
  options: RemeshBehaviorOptions<T>
): RemeshBehavior<T> => {
  const behaviorId = behaviorUid++

  const Behavior = ((...args) => {
    return {
      type: "RemeshBehaviorPayload",
      args,
      Behavior: Behavior,
    }
  }) as RemeshBehavior<T>

  Behavior.type = "RemeshBehavior"
  Behavior.behaviorId = behaviorId
  Behavior.behaviorName = options.behaviorName
  Behavior.impl = options.impl

  return Behavior
}

export type RemeshEffectContext = {
  fromEvent: <T>(Event: RemeshEvent<T>) => Observable<T>
  fromEffect: <T extends unknown[]>(Effect: RemeshEffectPayload<T>) => Observable<RemeshBehaviorPayload>
}

let effectUid = 0


export type RemeshEffectPayload<T extends unknown[] = unknown[]> = {
  type: "RemeshEffectPayload"
  args: T
  Effect: RemeshEffect<T>
}

export type RemeshEffect<T extends unknown[]> = {
  type: "RemeshEffect"
  effectId: number
  effectName: string
  impl: (...args: T) => (context: RemeshEffectContext) => Observable<RemeshBehaviorPayload>
  (...args: T): RemeshEffectPayload<T>
}

export type RemeshEffectOptions<T extends unknown[]> = {
  effectName: RemeshEffect<T>["effectName"]
  impl: RemeshEffect<T>["impl"]
}

export const RemeshEffect = <T extends unknown[]>(
  options: RemeshEffectOptions<T>
): RemeshEffect<T> => {
  const effectId = effectUid++

  const Effect = ((...args) => {
    return {
      type: "RemeshEffectPayload",
      args,
      Effect: Effect,
    }
  }) as RemeshEffect<T>

  Effect.effectId = effectId
  Effect.effectName = options.effectName
  Effect.impl = options.impl

  return Effect
}

export type RemeshStore = ReturnType<typeof RemeshStore>

/**
 * RemeshEntity is the item inside RemeshRepo
 */
type RemeshEntity = object

type RemeshQueryKey = string

type RemeshEntityStorage = {
  type: 'RemeshEntityStorage'
  entity: RemeshEntity
  downstream: Set<RemeshQueryStorage>
}

type RemeshRepoStorage<T extends RemeshEntity = RemeshEntity> = {
  type: "RemeshRepoStorage"
  entityMap: Map<string, T>
  entities: T[]
  downstream: Set<RemeshQueryStorage>
}

type RemeshQueryStorage<Arg = unknown, T = unknown> = {
  type: "RemeshQueryStorage"
  Query: RemeshQuery<Arg, T>
  arg: Arg,
  key: string
  value: T
  downstream: Set<RemeshQueryStorage>,
  upstream: Set<RemeshQueryStorage | RemeshEntityStorage>
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
  repo: Map<RemeshRepo<any>, RemeshRepoStorage<any>>
  entity: Map<RemeshEntity, RemeshEntityStorage>
  query: Map<RemeshQuery<any, any>, Map<RemeshQueryKey, RemeshQueryStorage<any, any>>>
  event: Map<RemeshEvent<any>, RemeshEventStorage<any>>
  subscription: Set<Subscription>
  dirty: Set<RemeshQueryStorage>
}

export type RemeshStoreOptions = {
  storeName: string
}

export const RemeshStore = (options: RemeshStoreOptions) => {
  const storage: RemeshStoreInternalStorage = {
    repo: new Map(),
    entity: new Map(),
    query: new Map(),
    event: new Map(),
    subscription: new Set(),
    dirty: new Set()
  }

  const getRepoStorage = <T extends object>(Repo: RemeshRepo<T>): RemeshRepoStorage<T> => {
    const repoStorage = storage.repo.get(Repo)

    if (repoStorage) {
      return repoStorage as RemeshRepoStorage<T>
    }

    storage.repo.set(Repo, {
      type: 'RemeshRepoStorage',
      entityMap: new Map(),
      entities: [],
      downstream: new Set()
    })

    return getRepoStorage(Repo)
  }

  const getEntityStorage = (entity: RemeshEntity): RemeshEntityStorage => {
    const entityStorage = storage.entity.get(entity)

    if (entityStorage) {
      return entityStorage
    }

    storage.entity.set(entity, {
      type: 'RemeshEntityStorage',
      entity,
      downstream: new Set()
    })

    return getEntityStorage(entity)
  }

  const getEventStorage = <T>(Event: RemeshEvent<T>): RemeshEventStorage<T> => {
    const eventStorage = storage.event.get(Event)

    if (eventStorage) {
      return eventStorage as RemeshEventStorage<T>
    }

    const subject = new Subject<T>()
    const observable = subject.asObservable()

    storage.event.set(Event, {
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable
    })

    return getEventStorage(Event)
  }

  const getQueryStorage = <T>(queryPayload: RemeshQueryPayload<unknown, T>): RemeshQueryStorage<unknown, T> => {
    const queryStorageMap = storage.query.get(queryPayload.Query)

    if (!queryStorageMap) {
      storage.query.set(queryPayload.Query, new Map())

      return getQueryStorage(queryPayload)
    }

    const queryKey = JSON.stringify(queryPayload.arg)

    const queryStorage = queryStorageMap.get(queryKey)

    if (queryStorage) {
      return queryStorage
    }

    const subject = new Subject<T>()
    const observable = subject.pipe(shareReplay({
      refCount: true,
      bufferSize: 1,
    }))

    const value = queryPayload.Query.impl(queryPayload.arg)({
      ...remeshQueryContext
    })

    queryStorageMap.set(queryKey, {
      type: 'RemeshQueryStorage',
      Query: queryPayload.Query,
      arg: queryPayload.arg,
      key: queryKey,
      value,
      downstream: new Set(),
      upstream: new Set(),
      subject,
      observable
    })

    return getQueryStorage(queryPayload)
  }

  const remeshQueryContext: RemeshQueryContext = {
    get: (Repo) => {
      const repoStorage = getRepoStorage(Repo)
      return repoStorage.entities
    },
    select: (Repo, predicate) => {
      const repoStorage = getRepoStorage(Repo)
      return repoStorage.entities.filter(predicate)
    },
    query: (queryPayload) => {
      const queryStorage = getQueryStorage(queryPayload)
      return queryStorage.value
    }
  }

  const remeshBehaviorContext: RemeshBehaviorContext = {
    get: remeshQueryContext.get,
    select: remeshQueryContext.select,
    query: remeshQueryContext.query
  }

  const remeshEffectContext: RemeshEffectContext = {
    fromEffect: effectPayload => {
      const { Effect, args } = effectPayload
      const observable = Effect.impl(...args)(remeshEffectContext)
      return observable
    },
    fromEvent: Event => {
      const eventStorage = getEventStorage(Event)
      return eventStorage.observable
    }
  }

  const handleInternalEvent = <T extends object>(eventPayload: RemeshEventPayload<T>) => {
    const { Event, data } = eventPayload

    if (isRemeshRepoAddedEventData<T>(data)) {
      const { Repo, entitiesWillAdd } = data
    }
  }

  const handleAddRepoEntities = <T extends object>(Repo: RemeshRepo<T>, entities: T[]) => {
    const repoStorage = getRepoStorage(Repo)

    const newEntities = repoStorage.entities.concat(entities)

    for (const entity of entities) {
      repoStorage.entityMap.set(entity[Repo.idKey] + '', entity)
    }

    repoStorage.entities = newEntities

    repoStorage.downstream
  }

  const handleEventPayload = <T>(eventPayload: RemeshEventPayload<T>) => {
    const { Event, data } = eventPayload
    const eventStorage = getEventStorage(Event)
    eventStorage.subject.next(data)
  }

  const handleBehaviorOutput = (behaviorOutput: RemeshBehaviorOutput) => {
    if (Array.isArray(behaviorOutput)) {
      for (const behaviorOutputItem of behaviorOutput) {
        handleBehaviorOutput(behaviorOutputItem)
      }
      return
    }

    handleEventPayload(behaviorOutput)
  }

  const subscribeEffect = <T extends unknown[]>(effectPayload: RemeshEffectPayload<T>) => {
    const behaviorObservable = remeshEffectContext.fromEffect(effectPayload)
    const subscription = behaviorObservable.subscribe({
      next: behaviorPayload => {
        const { Behavior, args } = behaviorPayload
        const behaviorOutput = Behavior.impl(...args)(remeshBehaviorContext)

        handleBehaviorOutput(behaviorOutput)
      }
    })

    storage.subscription.add(subscription)

    subscription.add(() => {
      storage.subscription.delete(subscription)
    })

    return subscription
  }

  const emit = <T>(eventPayload: RemeshEventPayload<T>) => {
    handleEventPayload(eventPayload)
  }

  const fromQuery = <T extends object>(queryPayload: RemeshQueryPayload<unknown, T>) => {
    const queryStorage = getQueryStorage(queryPayload)
    return queryStorage.observable
  }

  return {
    storeName: options.storeName,
    subscribeEffect,
    emit,
    get: remeshQueryContext.get,
    select: remeshQueryContext.select,
    query: remeshQueryContext.query,
    fromQuery,
    fromEvent: remeshEffectContext.fromEvent
  }
}


export const Remesh = {
  repo: RemeshRepo,
  query: RemeshQuery,
  behavior: RemeshBehavior,
  event: RemeshEvent,
  effect: RemeshEffect,
  store: RemeshStore
}
