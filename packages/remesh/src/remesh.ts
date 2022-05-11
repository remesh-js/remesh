import { Observable } from 'rxjs'
import shallowEqual from 'shallowequal'
import { isPlainObject } from 'is-plain-object'
import { DomainConceptName } from './type'

export type SerializableType =
  | void
  | number
  | string
  | boolean
  | null
  | undefined
  | SerializableType[]
  | { toJSON(): string }
  | { [key: string]: SerializableType }

export type GetterInput<T extends Args<SerializableType>, U> = RemeshStateItem<T, U> | RemeshQueryPayload<T, U>

export const RemeshValuePlaceholder = Symbol('RemeshValuePlaceholder')

export type RemeshValuePlaceholder = typeof RemeshValuePlaceholder

export type RemeshInjectedContext = {
  get: <T extends Args<SerializableType>, U>(input: GetterInput<T, U>) => U
  peek: <T extends Args<SerializableType>, U>(input: GetterInput<T, U>) => U | RemeshValuePlaceholder
  fromEvent: <T extends Args, U>(Event: RemeshEvent<T, U>) => Observable<U>
  fromQuery: <T extends Args<SerializableType>, U>(Query: RemeshQueryPayload<T, U>) => Observable<U>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
}

export type Args<T = unknown> = [] | [arg: T] | [arg?: T]

export type RemeshEvent<T extends Args, U> = {
  type: 'RemeshEvent'
  eventId: number
  eventName: DomainConceptName<'Event'>
  impl?: (context: RemeshEventContext, arg: T[0]) => U
  (...args: T): RemeshEventPayload<T, U>
  owner: RemeshDomainPayload<any, any>
  inspectable: boolean
}

export type RemeshEventPayload<T extends Args, U> = {
  type: 'RemeshEventPayload'
  arg: T[0]
  Event: RemeshEvent<T, U>
}

export type RemeshEventOptions<T extends Args, U> = {
  name: DomainConceptName<'Event'>
  inspectable?: boolean
  impl: (context: RemeshEventContext, ...args: T) => U
}

let eventUid = 0

export function RemeshEvent<T extends Args, U>(options: RemeshEventOptions<T, U>): RemeshEvent<T, U>
export function RemeshEvent<T = void>(options: Omit<RemeshEventOptions<[T], T>, 'impl'>): RemeshEvent<[T], T>
export function RemeshEvent<T extends Args, U>(
  options: RemeshEventOptions<T, U> | Omit<RemeshEventOptions<[], void>, 'impl'>,
): RemeshEvent<T, U> {
  const eventId = eventUid++

  const Event = ((arg) => {
    return {
      type: 'RemeshEventPayload',
      arg,
      Event,
    }
  }) as RemeshEvent<any, any>

  Event.type = 'RemeshEvent'
  Event.eventId = eventId
  Event.eventName = options.name
  Event.owner = DefaultDomain()
  Event.inspectable = 'inspectable' in options ? options.inspectable ?? true : true

  if ('impl' in options) {
    Event.impl = options.impl as (context: RemeshEventContext, arg: T[0]) => U
  }

  return Event
}

export type CompareFn<T> = (prev: T, curr: T) => boolean

export type RemeshState<T extends Args<SerializableType>, U> = {
  type: 'RemeshState'
  stateId: number
  stateName: DomainConceptName<'State'>
  defer: boolean
  impl: (arg: T[0]) => U
  (...args: T): RemeshStateItem<T, U>
  owner: RemeshDomainPayload<any, any>
  compare: CompareFn<U>
  inspectable: boolean
}

export type RemeshStateItem<T extends Args<SerializableType>, U> = {
  type: 'RemeshStateItem'
  arg: T[0]
  State: RemeshState<T, U>
  new: (newState: U) => RemeshStatePayload<T, U>
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

export type RemeshDeferStateOptions<T extends SerializableType, U> = {
  name: RemeshState<[T], U>['stateName']
  inspectable?: boolean
  compare?: RemeshState<[T], U>['compare']
}

export const RemeshDeferState = <T extends SerializableType = void, U = T>(options: RemeshDeferStateOptions<T, U>) => {
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

export type RemeshStatePayload<T extends Args<SerializableType>, U> = {
  type: 'RemeshStateSetterPayload'
  stateItem: RemeshStateItem<T, U>
  newState: U
}

export type RemeshStateOptions<T extends Args<SerializableType>, U> = {
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

export const RemeshState = <T extends Args<SerializableType>, U>(
  options: RemeshStateOptions<T, U>,
): RemeshState<T, U> => {
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
      new: (newState) => {
        return {
          type: 'RemeshStateSetterPayload',
          stateItem,
          newState,
        }
      },
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

export type RemeshQuery<T extends Args<SerializableType>, U> = {
  type: 'RemeshQuery'
  queryId: number
  queryName: DomainConceptName<'Query'>
  impl: (context: RemeshQueryContext, arg: T[0]) => U
  (...args: T): RemeshQueryPayload<T, U>
  owner: RemeshDomainPayload<any, any>
  compare: CompareFn<U>
  inspectable: boolean
}

export type RemeshQueryPayload<T extends Args<SerializableType>, U> = {
  type: 'RemeshQueryPayload'
  Query: RemeshQuery<T, U>
  arg: T[0]
}

export type RemeshQueryOptions<T extends Args<SerializableType>, U> = {
  name: DomainConceptName<'Query'>
  inspectable?: boolean
  impl: (context: RemeshQueryContext, ...args: T) => U
  compare?: RemeshQuery<T, U>['compare']
}

let queryUid = 0
export const RemeshQuery = <T extends Args<SerializableType>, U>(
  options: RemeshQueryOptions<T, U>,
): RemeshQuery<T, U> => {
  const queryId = queryUid++

  /**
   * optimize for nullary query
   */
  let cacheForNullary: RemeshQueryPayload<T, U> | null = null

  const Query = ((arg: T[0]) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const payload: RemeshQueryPayload<T, U> = {
      type: 'RemeshQueryPayload',
      Query,
      arg,
    }

    if (arg === undefined) {
      cacheForNullary = payload
    }

    return payload
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
}

export type RemeshCommandOutput =
  | RemeshStatePayload<any, any>
  | RemeshEventPayload<any, any>
  | RemeshCommandPayload<any>
  | RemeshCommand$Payload<any>
  | RemeshCommandOutput[]
  | null
  | undefined
  | void
  | false

export type RemeshCommandPayload<T extends Args> = {
  type: 'RemeshCommandPayload'
  arg: T[0]
  Command: RemeshCommand<T>
}

export type RemeshCommand<T extends Args> = {
  type: 'RemeshCommand'
  commandId: number
  commandName: DomainConceptName<'Command'>
  impl: (context: RemeshCommandContext, arg: T[0]) => RemeshCommandOutput
  (...args: T): RemeshCommandPayload<T>
  owner: RemeshDomainPayload<any, any>
  inspectable: boolean
}

export type RemeshCommandOptions<T extends Args> = {
  name: DomainConceptName<'Command'>
  inspectable?: boolean
  impl: (context: RemeshCommandContext, ...args: T) => RemeshCommandOutput
}

let commandUid = 0

export const RemeshCommand = <T extends Args>(options: RemeshCommandOptions<T>): RemeshCommand<T> => {
  const commandId = commandUid++

  const Command = ((arg: T[0]) => {
    return {
      type: 'RemeshCommandPayload',
      arg,
      Command,
    }
  }) as unknown as RemeshCommand<T>

  Command.type = 'RemeshCommand'
  Command.commandId = commandId
  Command.commandName = options.name
  Command.impl = options.impl as (context: RemeshCommandContext, arg: T[0]) => RemeshCommandOutput
  Command.owner = DefaultDomain()
  Command.inspectable = options.inspectable ?? true

  return Command
}

export type RemeshCommand$Context = {
  get: RemeshInjectedContext['get']
  peek: RemeshInjectedContext['peek']
  fromEvent: RemeshInjectedContext['fromEvent']
  fromQuery: RemeshInjectedContext['fromQuery']
}

export type RemeshCommand$Payload<T> = {
  type: 'RemeshCommand$Payload'
  arg: T
  Command$: RemeshCommand$<T>
}

export type RemeshCommand$<T> = {
  type: 'RemeshCommand$'
  command$Id: number
  command$Name: DomainConceptName<'Command$'>
  impl: (context: RemeshCommand$Context, arg$: Observable<T>) => Observable<RemeshCommandOutput>
  (arg: T): RemeshCommand$Payload<T>
  owner: RemeshDomainPayload<any, any>
  inspectable: boolean
}

export type RemeshCommand$Options<T> = {
  name: DomainConceptName<'Command$'>
  inspectable?: boolean
  impl: RemeshCommand$<T>['impl']
}
let command$Uid = 0

export const RemeshCommand$ = <T = void>(options: RemeshCommand$Options<T>): RemeshCommand$<T> => {
  const command$Id = command$Uid++

  const Command$ = ((arg) => {
    return {
      type: 'RemeshCommand$Payload',
      arg,
      Command$,
    }
  }) as RemeshCommand$<T>

  Command$.type = 'RemeshCommand$'
  Command$.command$Id = command$Id
  Command$.command$Name = options.name
  Command$.impl = options.impl
  Command$.owner = DefaultDomain()
  Command$.inspectable = options.inspectable ?? true

  return Command$
}

export type RemeshExternPayload<T> = {
  type: 'RemeshExternPayload'
  Extern: RemeshExtern<T>
  value: T
}

export type RemeshExtern<T> = {
  type: 'RemeshExtern'
  externName: DomainConceptName<'Extern'>
  externId: number
  default: T
  impl(value: T): RemeshExternPayload<T>
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
        type: 'RemeshExternPayload',
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
}

export type RemeshDomainIgniteFn = (context: RemeshDomainIgniteContext) => RemeshCommandOutput

export type RemeshDomainPreloadCommandOutput =
  | RemeshStatePayload<any, any>
  | RemeshCommandPayload<any>
  | RemeshDomainPreloadCommandOutput[]
  | null
  | undefined
  | void
  | false

export type RemeshDomainPreloadOptions<T extends SerializableType> = {
  key: string
  query: (context: RemeshQueryContext) => Promise<T>
  command: (context: RemeshCommandContext, data: T) => RemeshDomainPreloadCommandOutput
}

export type RemeshDomainContext = {
  // definitions
  state: typeof RemeshState & typeof RemeshDefaultState & typeof RemeshDeferState
  event: typeof RemeshEvent
  query: typeof RemeshQuery
  command: typeof RemeshCommand
  command$: typeof RemeshCommand$
  ignite: (fn: RemeshDomainIgniteFn) => void
  preload: <T extends SerializableType>(options: RemeshDomainPreloadOptions<T>) => void
  // methods
  getDomain: <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    domainPayload: RemeshDomainPayload<T, U>,
  ) => {
    [key in keyof ValidRemeshDomainDefinition<T>]: ValidRemeshDomainDefinition<T>[key]
  }
  getExtern: <T>(Extern: RemeshExtern<T>) => T
}

export type RemeshDomainOutput = {
  event: {
    [key: string]: RemeshEvent<any, any>
  }
  query: {
    [key: string]: RemeshQuery<any, any>
  }
  command: {
    [key: string]: RemeshCommand<any> | RemeshCommand$<any>
  }
}

export type RemeshDomainDefinition = Partial<RemeshDomainOutput>

type ShowKey<T> = T extends string ? T : 'key'

export type ValidRemeshDomainDefinition<T extends RemeshDomainDefinition> = Pick<
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
      [key in keyof T['command']]: T['command'][key] extends RemeshCommand$<any>
        ? key extends DomainConceptName<'Command$'>
          ? T['command'][key]
          : `${ShowKey<key>} is not a valid command$ name`
        : key extends DomainConceptName<'Command'>
        ? T['command'][key]
        : `${ShowKey<key>} is not a valid command name`
    }
  },
  ('event' | 'query' | 'command') & keyof T
>

export const RemeshModule = <T extends RemeshDomainDefinition>(
  module: T,
): {
  [key in keyof ValidRemeshDomainDefinition<T>]: ValidRemeshDomainDefinition<T>[key]
} => {
  return module as unknown as ValidRemeshDomainDefinition<T>
}

export type RemeshDomain<T extends RemeshDomainDefinition, U extends Args<SerializableType>> = {
  type: 'RemeshDomain'
  domainName: DomainConceptName<'Domain'>
  domainId: number
  impl: (context: RemeshDomainContext, arg: U[0]) => T
  (...args: U): RemeshDomainPayload<T, U>
  inspectable: boolean
}

export type RemeshDomainPayload<T extends RemeshDomainDefinition, U extends Args<SerializableType>> = {
  type: 'RemeshDomainPayload'
  Domain: RemeshDomain<T, U>
  arg: U[0]
}

export type RemeshDomainOptions<T extends RemeshDomainDefinition, U extends Args<SerializableType>> = {
  name: DomainConceptName<'Domain'>
  inspectable?: boolean
  impl: (context: RemeshDomainContext, ...args: U) => T
}

let domainUid = 0

export const RemeshDomain = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
  options: RemeshDomainOptions<T, U>,
): RemeshDomain<T, U> => {
  /**
   * optimize for nullary domain
   */
  let cacheForNullary: RemeshDomainPayload<T, U> | null = null

  const Domain: RemeshDomain<T, U> = ((arg: U[0]) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const result: RemeshDomainPayload<T, U> = {
      type: 'RemeshDomainPayload',
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
