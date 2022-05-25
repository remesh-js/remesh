import { Observable } from 'rxjs'
import shallowEqual from 'shallowequal'
import { isPlainObject } from 'is-plain-object'
import { DomainConceptName } from './type'

export type Serializable =
  | void
  | undefined
  | number
  | string
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable }
  | readonly Serializable[]
  | { readonly [key: string]: Serializable }

export type Args<T = unknown> = [] | [arg: T] | [arg?: T]

export type GetterInput<T extends Args<Serializable>, U> = RemeshStateItem<T, U> | RemeshQueryAction<T, U>

export type SetterInput<T extends Args<Serializable>, U> = RemeshStateItem<T, U>

export const RemeshValuePlaceholder = Symbol('RemeshValuePlaceholder')

export type RemeshValuePlaceholder = typeof RemeshValuePlaceholder

export type RemeshInjectedContext = {
  get: <T extends Args<Serializable>, U>(input: GetterInput<T, U>) => U
  peek: <T extends Args<Serializable>, U>(input: GetterInput<T, U>) => U | RemeshValuePlaceholder
  set: <T extends Args<Serializable>, U>(input: SetterInput<T, U>, value: U) => void
  send: <T extends Args, U>(input: RemeshCommandAction<T, U>) => U
  emit: <T, U>(input: RemeshEventAction<T, U>) => void
  fromEvent: <T, U>(Event: RemeshEvent<T, U> | RemeshSubscribeOnlyEvent<T, U>) => Observable<U>
  fromQuery: <T extends Args<Serializable>, U>(Query: RemeshQueryAction<T, U>) => Observable<U>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
  set: RemeshInjectedContext['set']
  send: RemeshInjectedContext['send']
  emit: RemeshInjectedContext['emit']
  fromEvent: RemeshInjectedContext['fromEvent']
  fromQuery: RemeshInjectedContext['fromQuery']
}

export type RemeshEvent<T, U> = {
  type: 'RemeshEvent'
  eventId: number
  eventName: DomainConceptName<'Event'>
  impl?: (context: RemeshEventContext, arg$: Observable<T>) => Observable<U>
  (arg: T): RemeshEventAction<T, U>
  owner: RemeshDomainAction<any, any>
  inspectable: boolean
  toSubscribeOnlyEvent: () => RemeshSubscribeOnlyEvent<T, U>
}

export type RemeshEventAction<T, U> = {
  type: 'RemeshEventAction'
  arg: T
  Event: RemeshEvent<T, U>
}

export type RemeshEventOptions<T, U> = {
  name: DomainConceptName<'Event'>
  inspectable?: boolean
  impl: (context: RemeshEventContext, arg$: Observable<T>) => Observable<U>
}

let eventUid = 0

export function RemeshEvent<T = void, U = void>(options: RemeshEventOptions<T, U>): RemeshEvent<T, U>
export function RemeshEvent<T = void>(options: Omit<RemeshEventOptions<T, T>, 'impl'>): RemeshEvent<T, T>
export function RemeshEvent<T, U>(
  options: RemeshEventOptions<T, U> | Omit<RemeshEventOptions<[], void>, 'impl'>,
): RemeshEvent<T, U> {
  const eventId = eventUid++

  const Event = ((arg: T) => {
    return {
      type: 'RemeshEventAction',
      arg,
      Event: Event,
    }
  }) as RemeshEvent<T, U>

  Event.type = 'RemeshEvent'
  Event.eventId = eventId
  Event.eventName = options.name
  Event.owner = DefaultDomain()
  Event.inspectable = 'inspectable' in options ? options.inspectable ?? true : true
  Event.toSubscribeOnlyEvent = () => {
    return toRemeshSubscribeOnlyEvent(Event)
  }

  if ('impl' in options) {
    Event.impl = options.impl
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

export type RemeshState<T extends Args<Serializable>, U> = {
  type: 'RemeshState'
  stateId: number
  stateName: DomainConceptName<'State'>
  defer: boolean
  impl: (arg: T[0]) => U
  (...args: T): RemeshStateItem<T, U>
  owner: RemeshDomainAction<any, any>
  compare: CompareFn<U>
  inspectable: boolean
}

export type RemeshStateItem<T extends Args<Serializable>, U> = {
  type: 'RemeshStateItem'
  arg: T[0]
  State: RemeshState<T, U>
}

export type RemeshDefaultStateOptions<T> = {
  name: RemeshState<[], T>['stateName']
  default: T
  inspectable?: boolean
  compare?: RemeshState<[], T>['compare']
}

export const RemeshDefaultState = <T>(options: RemeshDefaultStateOptions<T>): RemeshState<[], T> => {
  return RemeshState({
    name: options.name,
    impl: () => options.default,
    inspectable: options.inspectable,
    compare: options.compare,
  })
}

export type RemeshDeferStateOptions<T extends Serializable, U> = {
  name: RemeshState<[T], U>['stateName']
  inspectable?: boolean
  compare?: RemeshState<[T], U>['compare']
}

export const RemeshDeferState = <T extends Serializable = void, U = T>(options: RemeshDeferStateOptions<T, U>) => {
  return RemeshState({
    name: options.name,
    defer: true,
    impl: (..._args: [T]): U => {
      throw new Error(`RemeshDeferState: use ${options.name} before setting state`)
    },
    inspectable: options.inspectable,
    compare: options.compare,
  })
}

export type RemeshStateOptions<T extends Args<Serializable>, U> = {
  name: DomainConceptName<'State'>
  defer?: boolean
  impl: (...args: T) => U
  inspectable?: boolean
  compare?: CompareFn<U>
}

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

export const RemeshState = <T extends Args<Serializable>, U>(options: RemeshStateOptions<T, U>): RemeshState<T, U> => {
  const stateId = stateUid++

  type StateItem = RemeshStateItem<T, U>

  let cacheForNullary = null as StateItem | null

  const State = ((arg: T[0]) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const stateItem: StateItem = {
      type: 'RemeshStateItem',
      arg,
      State,
    }

    if (arg === undefined) {
      cacheForNullary = stateItem
    }

    return stateItem
  }) as unknown as RemeshState<T, U>

  State.type = 'RemeshState'
  State.stateId = stateId
  State.stateName = options.name
  State.impl = options.impl as (arg: T[0]) => U
  State.compare = options.compare ?? defaultCompare
  State.owner = DefaultDomain()
  State.inspectable = options.inspectable ?? true
  State.defer = options.defer ?? false

  return State
}

export type RemeshSchedulerContext = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
  fromEvent: RemeshInjectedContext['fromEvent']
  fromQuery: RemeshInjectedContext['fromQuery']
}

export type RemeshQueryContext = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
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
  peek: RemeshInjectedContext['peek']
  set: RemeshInjectedContext['set']
  send: RemeshInjectedContext['send']
  emit: RemeshInjectedContext['emit']
}

export type RemeshCommandAction<T extends Args, U> = {
  type: 'RemeshCommandAction'
  arg: T[0]
  Command: RemeshCommand<T, U>
}

export type RemeshCommand<T extends Args, U> = {
  type: 'RemeshCommand'
  commandId: number
  commandName: DomainConceptName<'Command'>
  impl: (context: RemeshCommandContext, ...args: T) => U
  (...args: T): RemeshCommandAction<T, U>
  owner: RemeshDomainAction<any, any>
  inspectable: boolean
}

export type RemeshCommandOptions<T extends Args, U> = {
  name: DomainConceptName<'Command'>
  inspectable?: boolean
  impl: (context: RemeshCommandContext, ...args: T) => U
}

let commandUid = 0

export const RemeshCommand = <T extends Args = [], U = void>(
  options: RemeshCommandOptions<T, U>,
): RemeshCommand<T, U> => {
  const commandId = commandUid++

  const Command = ((arg: T[0]) => {
    return {
      type: 'RemeshCommandAction',
      arg,
      Command,
    }
  }) as unknown as RemeshCommand<T, U>

  Command.type = 'RemeshCommand'
  Command.commandId = commandId
  Command.commandName = options.name
  Command.impl = options.impl
  Command.owner = DefaultDomain()
  Command.inspectable = options.inspectable ?? true

  return Command
}

export type RemeshExternImpl<T> = {
  type: 'RemeshExternImpl'
  Extern: RemeshExtern<T>
  value: T
}

export type RemeshExtern<T> = {
  type: 'RemeshExtern'
  externName: DomainConceptName<'Extern'>
  externId: number
  default: T
  impl(value: T): RemeshExternImpl<T>
}

export type RemeshExternOptions<T> = {
  name: RemeshExtern<T>['externName']
  default: RemeshExtern<T>['default']
}

let externUid = 0
export const RemeshExtern = <T = void>(options: RemeshExternOptions<T>): RemeshExtern<T> => {
  const Extern: RemeshExtern<T> = {
    type: 'RemeshExtern',
    externName: options.name,
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

export type RemeshDomainIgniteContext = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
  set: RemeshInjectedContext['set']
  send: RemeshInjectedContext['send']
  emit: RemeshInjectedContext['emit']
}

export type RemeshDomainIgniteFn = (context: RemeshDomainIgniteContext) => unknown

export type RemeshDomainPreloadCommandContext = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
  set: RemeshInjectedContext['set']
  send: RemeshInjectedContext['send']
}

export type RemeshDomainPreloadOptions<T extends Serializable> = {
  key: string
  query: (context: RemeshQueryContext) => Promise<T>
  command: (context: RemeshDomainPreloadCommandContext, data: T) => void
}

export type RemeshDomainContext = {
  // definitions
  state: typeof RemeshState & typeof RemeshDefaultState & typeof RemeshDeferState
  event: typeof RemeshEvent
  query: typeof RemeshQuery
  command: typeof RemeshCommand
  ignite: (fn: RemeshDomainIgniteFn) => void
  preload: <T extends Serializable>(options: RemeshDomainPreloadOptions<T>) => void
  // methods
  getDomain: <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    domainAction: RemeshDomainAction<T, U>,
  ) => {
    [key in keyof VerifiedRemeshDomainDefinition<T>]: VerifiedRemeshDomainDefinition<T>[key]
  }
  getExtern: <T>(Extern: RemeshExtern<T>) => T
}

export type RemeshDomainOutput = {
  event: {
    [key: string]: RemeshEvent<any, any> | RemeshSubscribeOnlyEvent<any, any>
  }
  query: {
    [key: string]: RemeshQuery<any, any>
  }
  command: {
    [key: string]: RemeshCommand<any, any>
  }
}

export type RemeshDomainDefinition = Partial<RemeshDomainOutput>

type ShowKey<T> = T extends string ? T : 'key'

export type VerifiedRemeshDomainDefinition<T extends RemeshDomainDefinition> = Pick<
  {
    event: {
      [key in keyof T['event']]: key extends DomainConceptName<'Event'>
        ? T['event'][key]
        : `${ShowKey<key>} is not a valid event name`
    }
    query: {
      [key in keyof T['query']]: key extends DomainConceptName<'Query'>
        ? T['query'][key]
        : `${ShowKey<key>} is not a valid query name`
    }
    command: {
      [key in keyof T['command']]: key extends DomainConceptName<'Command'>
        ? T['command'][key]
        : `${ShowKey<key>} is not a valid command name`
    }
  },
  ('event' | 'query' | 'command') & keyof T
>

export const toValidRemeshDomainDefinition = <T extends RemeshDomainDefinition>(
  domainDefinition: T,
): VerifiedRemeshDomainDefinition<T> => {
  const result = {} as VerifiedRemeshDomainDefinition<T>

  if (domainDefinition.event) {
    result.event = domainDefinition.event as unknown as typeof result.event
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

export const DefaultDomain: RemeshDomain<any, []> = RemeshDomain({
  name: 'DefaultDomain',
  impl: () => {
    return {}
  },
})
