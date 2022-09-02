import { Observable, ObservableInput } from 'rxjs'
import shallowEqual from 'shallowequal'
import { isPlainObject } from 'is-plain-object'
import { DomainConceptName } from './type'

export type SerializablePrimitives = void | undefined | number | string | boolean | null

export type SerializableArray = Serializable[]

export type SerializableObject = { [key: string]: Serializable }

export type Serializable = SerializablePrimitives | SerializableArray | SerializableObject | Serializable[]

export type ToType<T> = T extends object | unknown[]
  ? {
      [key in keyof T]: ToType<T[key]>
    }
  : T

export type Args<T = unknown> = [] | [arg: T] | [arg?: T]

export type RemeshInjectedContext = {
  get<T extends Args<Serializable>, U>(input: RemeshQueryAction<T, U>): U
  get<state>(input: RemeshStateItem<state>): state
  get(input: RemeshStateItem<any> | RemeshQueryAction<any, any>): unknown
  fromEvent: <T extends Args, U>(Event: RemeshEvent<T, U> | RemeshSubscribeOnlyEvent<T, U>) => Observable<U>
  fromQuery: <T extends Args<Serializable>, U>(Query: RemeshQueryAction<T, U>) => Observable<U>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshEvent<T extends Args, U> = {
  type: 'RemeshEvent'
  eventId: number
  eventName: DomainConceptName<'Event'>
  impl?: (context: RemeshEventContext, arg: T[0]) => U
  (...args: T): RemeshEventAction<T, U>
  owner: RemeshDomainAction<any, any>
  inspectable: boolean
  toSubscribeOnlyEvent: () => RemeshSubscribeOnlyEvent<T, U>
}

export type RemeshEventAction<T extends Args, U> = {
  type: 'RemeshEventAction'
  arg: T[0]
  Event: RemeshEvent<T, U>
}

export type RemeshEventOptions<T extends Args, U> = {
  name: DomainConceptName<'Event'>
  inspectable?: boolean
  impl: (context: RemeshEventContext, ...args: T) => U
}

let eventUid = 0

export function RemeshEvent<T extends Args = [], U = void>(options: RemeshEventOptions<T, U>): RemeshEvent<T, U>
export function RemeshEvent<T = void>(options: Omit<RemeshEventOptions<[T], T>, 'impl'>): RemeshEvent<[T], T>
export function RemeshEvent<T extends Args, U>(
  options: RemeshEventOptions<T, U> | Omit<RemeshEventOptions<[], void>, 'impl'>,
): RemeshEvent<T, U> {
  const eventId = eventUid++

  const Event = ((arg: T[0]): RemeshEventAction<T, U> => {
    return {
      type: 'RemeshEventAction',
      arg,
      Event,
    }
  }) as unknown as RemeshEvent<T, U>

  Event.type = 'RemeshEvent'
  Event.eventId = eventId
  Event.eventName = options.name
  Event.owner = DefaultDomain()
  Event.inspectable = 'inspectable' in options ? options.inspectable ?? true : true
  Event.toSubscribeOnlyEvent = () => {
    return toRemeshSubscribeOnlyEvent(Event)
  }

  if ('impl' in options) {
    Event.impl = options.impl as unknown as typeof Event.impl
  }

  return Event
}

export type RemeshSubscribeOnlyEvent<_T, _U> = {
  type: 'RemeshSubscribeOnlyEvent'
  eventId: number
  eventName: DomainConceptName<'Event'>
}

export type ToRemeshSubscribeOnlyEvent<T> = T extends RemeshSubscribeOnlyEvent<any, any>
  ? T
  : T extends RemeshEvent<infer TT, infer UU>
  ? RemeshSubscribeOnlyEvent<TT, UU>
  : never

export type ToRemeshSubscribeOnlyEventMap<T extends RemeshDomainOutput['event']> = {
  [K in keyof T]: ToRemeshSubscribeOnlyEvent<T[K]>
}

const eventToSubscribeOnlyEventWeakMap = new WeakMap<RemeshEvent<any, any>, RemeshSubscribeOnlyEvent<any, any>>()
const subscribeOnlyEventToEventWeakMap = new WeakMap<RemeshSubscribeOnlyEvent<any, any>, RemeshEvent<any, any>>()

export const toRemeshSubscribeOnlyEvent = <T, U>(event: RemeshEvent<any, U>): RemeshSubscribeOnlyEvent<T, U> => {
  const subscribeOnlyEvent = eventToSubscribeOnlyEventWeakMap.get(event)

  if (subscribeOnlyEvent) {
    return subscribeOnlyEvent
  }

  const newSubscribeOnlyEvent = {
    type: 'RemeshSubscribeOnlyEvent',
    eventId: event.eventId,
    eventName: event.eventName,
  } as RemeshSubscribeOnlyEvent<T, U>

  eventToSubscribeOnlyEventWeakMap.set(event, newSubscribeOnlyEvent)

  subscribeOnlyEventToEventWeakMap.set(newSubscribeOnlyEvent, event)

  return newSubscribeOnlyEvent
}

export const internalToOriginalEvent = <T extends Args, U>(
  subscribeOnlyEvent: RemeshSubscribeOnlyEvent<T, U>,
): RemeshEvent<T, U> => {
  const event = subscribeOnlyEventToEventWeakMap.get(subscribeOnlyEvent)

  if (event) {
    return event
  }

  throw new Error(`SubscribeOnlyEvent ${subscribeOnlyEvent.eventName} does not have an associated Event`)
}

export type CompareFn<T> = (prev: T, curr: T) => boolean

export const DefaultStateValue = Symbol('DefaultStateValue')

export type DefaultStateValue = typeof DefaultStateValue

export type RemeshState<T> = {
  type: 'RemeshState'
  stateId: number
  stateName: DomainConceptName<'State'>
  (): RemeshStateItem<T>
  default: T | (() => T) | DefaultStateValue
  owner: RemeshDomainAction<any, any>
  compare: CompareFn<T>
  inspectable: boolean
}

export type RemeshStateItem<T> = {
  type: 'RemeshStateItem'
  State: RemeshState<T>
  new: (state: T) => RemeshStateItemUpdatePayload<T>
}

export type RemeshStateItemUpdatePayload<T> = {
  type: 'RemeshStateItemUpdatePayload'
  key?: string
  value: T
  stateItem: RemeshStateItem<T>
}

export type RemeshStateOptions<T> = {
  name: DomainConceptName<'State'>
  inspectable?: boolean
  compare?: CompareFn<T>
} & (
  | {
      default: T | (() => T)
    }
  | {
      defer: true
    }
)

let stateUid = 0

export const defaultCompare = <T>(prev: T, curr: T) => {
  if (isPlainObject(prev) && isPlainObject(curr)) {
    return shallowEqual(prev, curr)
  }

  if (Array.isArray(prev) && Array.isArray(curr)) {
    return shallowEqual(prev, curr)
  }

  return prev === curr
}

export const RemeshState = <T>(options: RemeshStateOptions<T>): RemeshState<T> => {
  const stateId = stateUid++

  type StateItem = RemeshStateItem<T>

  let cacheForNullary = null as StateItem | null

  const State = (() => {
    if (cacheForNullary) {
      return cacheForNullary
    }

    const stateItem: StateItem = {
      type: 'RemeshStateItem',
      State,
      new: (newState) => {
        return {
          type: 'RemeshStateItemUpdatePayload',
          value: newState,
          stateItem,
        }
      },
    }

    cacheForNullary = stateItem

    return stateItem
  }) as RemeshState<T>

  State.type = 'RemeshState'
  State.stateId = stateId
  State.stateName = options.name

  if ('default' in options) {
    State.default = options.default
  } else if (options.defer) {
    State.default = DefaultStateValue
  }

  State.compare = options.compare ?? defaultCompare
  State.owner = DefaultDomain()
  State.inspectable = options.inspectable ?? true

  return State
}

export type RemeshQueryContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshQuery<T extends Args<Serializable>, U> = {
  type: 'RemeshQuery'
  queryId: number
  queryName: DomainConceptName<'Query'>
  impl: (context: RemeshQueryContext, arg: T[0]) => U
  (...args: T): RemeshQueryAction<T, U>
  owner: RemeshDomainAction<any, any>
  compare: CompareFn<U>
  inspectable: boolean
}

export type RemeshQueryAction<T extends Args<Serializable>, U> = {
  type: 'RemeshQueryAction'
  Query: RemeshQuery<T, U>
  arg: T[0]
}

export type RemeshQueryOptions<T extends Args<Serializable>, U> = {
  name: DomainConceptName<'Query'>
  inspectable?: boolean
  impl: (context: RemeshQueryContext, ...args: T) => U
  compare?: RemeshQuery<T, U>['compare']
}

let queryUid = 0
export const RemeshQuery = <T extends Args<Serializable>, U>(options: RemeshQueryOptions<T, U>): RemeshQuery<T, U> => {
  const queryId = queryUid++

  /**
   * optimize for nullary query
   */
  let cacheForNullary: RemeshQueryAction<T, U> | null = null

  const Query = ((arg: T[0]) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const action: RemeshQueryAction<T, U> = {
      type: 'RemeshQueryAction',
      Query,
      arg,
    }

    if (arg === undefined) {
      cacheForNullary = action
    }

    return action
  }) as unknown as RemeshQuery<T, U>

  Query.type = 'RemeshQuery'
  Query.queryId = queryId
  Query.queryName = options.name
  Query.impl = options.impl as (context: RemeshQueryContext, arg: T[0]) => U
  Query.compare = options.compare ?? defaultCompare
  Query.owner = DefaultDomain()
  Query.inspectable = options.inspectable ?? true

  return Query
}

export type RemeshCommandContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshCommandAction<T extends Args> = {
  type: 'RemeshCommandAction'
  arg: T[0]
  Command: RemeshCommand<T>
}

export type RemeshCommandOutput =
  | RemeshCommandAction<any>
  | RemeshEventAction<any, any>
  | RemeshStateItemUpdatePayload<any>
  | RemeshCommandOutput[]
  | null

export type RemeshCommand<T extends Args> = {
  type: 'RemeshCommand'
  commandId: number
  commandName: DomainConceptName<'Command'>
  impl: (context: RemeshCommandContext, ...args: T) => RemeshCommandOutput
  (...args: T): RemeshCommandAction<T>
  owner: RemeshDomainAction<any, any>
  before: (task: RemeshCommandTask<T>) => void
  after: (task: RemeshCommandTask<T>) => void
  inspectable: boolean
}

type RemeshCommandTask<T extends Args> = (context: RemeshCommandContext, ...args: T) => RemeshCommandOutput

export type RemeshCommandOptions<T extends Args> = {
  name: DomainConceptName<'Command'>
  inspectable?: boolean
  impl: (context: RemeshCommandContext, ...args: T) => RemeshCommandOutput
}

let commandUid = 0

const remeshCommandTaskStore = {
  before: new WeakMap<RemeshCommand<any>, Set<RemeshCommandTask<any>>>(),
  after: new WeakMap<RemeshCommand<any>, Set<RemeshCommandTask<any>>>(),
}

export const getCommandTaskSet = <T extends Args>(Command: RemeshCommand<T>, type: 'before' | 'after') => {
  return remeshCommandTaskStore[type].get(Command)
}

export const RemeshCommand = <T extends Args = []>(options: RemeshCommandOptions<T>): RemeshCommand<T> => {
  const commandId = commandUid++

  const Command = ((arg: T[0]) => {
    return {
      type: 'RemeshCommandAction',
      arg,
      Command,
    }
  }) as unknown as RemeshCommand<T>

  Command.type = 'RemeshCommand'
  Command.commandId = commandId
  Command.commandName = options.name
  Command.impl = options.impl
  Command.owner = DefaultDomain()
  Command.inspectable = options.inspectable ?? true

  Command.before = (task) => {
    if (remeshCommandTaskStore.before.has(Command)) {
      return remeshCommandTaskStore.before.get(Command)!.add(task)
    }
    const taskSet = new Set<RemeshCommandTask<T>>()
    remeshCommandTaskStore.before.set(Command, taskSet)
    taskSet.add(task)
    return taskSet
  }

  Command.after = (task) => {
    if (remeshCommandTaskStore.after.has(Command)) {
      return remeshCommandTaskStore.after.get(Command)!.add(task)
    }
    const taskSet = new Set<RemeshCommandTask<T>>()
    remeshCommandTaskStore.after.set(Command, taskSet)
    taskSet.add(task)
    return taskSet
  }

  return Command
}

export type RemeshExternImpl<T> = {
  type: 'RemeshExternImpl'
  Extern: RemeshExtern<T>
  value: T
}

export type RemeshExtern<T> = {
  type: 'RemeshExtern'
  externId: number
  default: T
  impl(value: T): RemeshExternImpl<T>
}

export type RemeshExternOptions<T> = {
  default: RemeshExtern<T>['default']
}

let externUid = 0
export const RemeshExtern = <T>(options: RemeshExternOptions<T>): RemeshExtern<T> => {
  const Extern: RemeshExtern<T> = {
    type: 'RemeshExtern',
    externId: externUid++,
    default: options.default,
    impl: (value) => {
      return {
        type: 'RemeshExternImpl',
        Extern,
        value,
      }
    },
  }

  return Extern
}

export type RemeshDomainPreloadQueryContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshDomainPreloadCommandContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshDomainPreloadCommandOutput =
  | RemeshStateItemUpdatePayload<any>
  | RemeshDomainPreloadCommandOutput[]
  | null

export type RemeshDomainPreloadOptions<T extends Serializable> = {
  key: string
  query: (context: RemeshDomainPreloadQueryContext) => Promise<T>
  command: (context: RemeshDomainPreloadCommandContext, data: T) => RemeshDomainPreloadCommandOutput
}

export type RemeshEffectContext = {
  get: RemeshInjectedContext['get']
  fromEvent: RemeshInjectedContext['fromEvent']
  fromQuery: RemeshInjectedContext['fromQuery']
}

export type RemeshAction = RemeshEventAction<any, any> | RemeshCommandAction<any> | null | RemeshAction[]

export type RemeshEffect = {
  name: DomainConceptName<'Effect'>
  impl: (context: RemeshEffectContext) => ObservableInput<RemeshAction> | null
}

export type RemeshDomainContext = {
  // definitions
  state: typeof RemeshState
  event: typeof RemeshEvent
  query: typeof RemeshQuery
  command: typeof RemeshCommand
  effect: (effect: RemeshEffect) => void
  preload: <T extends Serializable>(options: RemeshDomainPreloadOptions<T>) => void
  // methods
  getExtern: <T>(Extern: RemeshExtern<T>) => T
  getDomain: <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ) => {
    [key in keyof VerifiedRemeshDomainDefinition<T>]: VerifiedRemeshDomainDefinition<T>[key]
  }
}

export type RemeshEvents = {
  [key: string]: RemeshEvent<any, any> | RemeshSubscribeOnlyEvent<any, any>
}

export type RemeshQueries = {
  [key: string]: RemeshQuery<any, any>
}

export type RemeshCommands = {
  [key: string]: RemeshCommand<any>
}

export type RemeshDomainOutput = {
  event: RemeshEvents
  query: RemeshQueries
  command: RemeshCommands
}

export type RemeshDomainDefinition = Partial<RemeshDomainOutput>

export type VerifiedRemeshDomainDefinition<T extends RemeshDomainDefinition> = Pick<
  {
    event: {
      [key in keyof T['event']]: key extends DomainConceptName<'Event'>
        ? ToRemeshSubscribeOnlyEvent<T['event'][key]>
        : `${key & string} is not a valid event name`
    }
    query: {
      [key in keyof T['query']]: key extends DomainConceptName<'Query'>
        ? T['query'][key]
        : `${key & string} is not a valid query name`
    }
    command: {
      [key in keyof T['command']]: key extends DomainConceptName<'Command'>
        ? T['command'][key]
        : `${key & string} is not a valid command name`
    }
  },
  ('event' | 'query' | 'command') & keyof T
>

export const toValidRemeshDomainDefinition = <T extends RemeshDomainDefinition>(
  domainDefinition: T,
): VerifiedRemeshDomainDefinition<T> => {
  const result = {} as VerifiedRemeshDomainDefinition<T>

  if (domainDefinition.event) {
    const eventRecord = {} as VerifiedRemeshDomainDefinition<T>['event']

    for (const key in domainDefinition.event) {
      const event = domainDefinition.event[key]
      if (event.type === 'RemeshSubscribeOnlyEvent') {
        eventRecord[key] = event
      } else {
        eventRecord[key] = toRemeshSubscribeOnlyEvent(event)
      }
    }

    result.event = eventRecord
  }

  if (domainDefinition.query) {
    result.query = domainDefinition.query as unknown as typeof result.query
  }

  if (domainDefinition.command) {
    result.command = domainDefinition.command as unknown as typeof result.command
  }

  return result
}

export const RemeshModule = <T extends RemeshDomainDefinition>(
  module: T,
): {
  [key in keyof VerifiedRemeshDomainDefinition<T>]: VerifiedRemeshDomainDefinition<T>[key]
} => {
  return toValidRemeshDomainDefinition(module)
}

export type RemeshDomain<T extends RemeshDomainDefinition, U extends Args<Serializable>> = {
  type: 'RemeshDomain'
  domainName: DomainConceptName<'Domain'>
  domainId: number
  impl: (context: RemeshDomainContext, arg: U[0]) => T
  (...args: U): RemeshDomainAction<T, U>
  inspectable: boolean
}

export type RemeshDomainAction<T extends RemeshDomainDefinition, U extends Args<Serializable>> = {
  type: 'RemeshDomainAction'
  Domain: RemeshDomain<T, U>
  arg: U[0]
}

export type RemeshDomainOptions<T extends RemeshDomainDefinition, U extends Args<Serializable>> = {
  name: DomainConceptName<'Domain'>
  inspectable?: boolean
  impl: (context: RemeshDomainContext, ...args: U) => T
}

let domainUid = 0
export const RemeshDomain = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
  options: RemeshDomainOptions<T, U>,
): RemeshDomain<T, U> => {
  /**
   * optimize for nullary domain
   */
  let cacheForNullary: RemeshDomainAction<T, U> | null = null

  const Domain: RemeshDomain<T, U> = ((arg: U[0]) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const result: RemeshDomainAction<T, U> = {
      type: 'RemeshDomainAction',
      Domain,
      arg,
    }

    if (arg === undefined) {
      cacheForNullary = result
    }

    return result
  }) as unknown as RemeshDomain<T, U>

  Domain.type = 'RemeshDomain'
  Domain.domainId = domainUid++
  Domain.domainName = options.name
  Domain.impl = options.impl as (context: RemeshDomainContext, arg: U[0]) => T
  Domain.inspectable = options.inspectable ?? true

  return Domain
}

export const DefaultDomain: RemeshDomain<{}, []> = RemeshDomain({
  name: 'DefaultDomain',
  impl: () => {
    return {}
  },
})
