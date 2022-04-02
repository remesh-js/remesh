import { concatMap, exhaustMap, mergeMap, Observable, switchMap } from 'rxjs'

import shallowEqual from 'shallowequal'

export type Undefined2Void<T> = undefined extends T ? Exclude<T, undefined> | void : T

export const undefined2Void = <T>(value: T): Undefined2Void<T> => {
  return value as Undefined2Void<T>
}

export type ExtractFirstArg<T extends (...args: any) => any> = Undefined2Void<Parameters<T>[0]>

export type ExtractSecondArg<T extends (...args: any) => any> = Undefined2Void<Parameters<T>[1]>

export type RemeshInjectedContext = {
  get: <T, U>(input: RemeshStateItem<T, U> | RemeshQueryPayload<T, U>) => U
  fromEvent: <T, U>(Event: RemeshEvent<T, U>) => Observable<U>
  fromQuery: <T, U>(Query: RemeshQueryPayload<T, U>) => Observable<U>
}

export type RemeshEventContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshEvent<T, U = T> = {
  type: 'RemeshEvent'
  eventId: number
  eventName: string
  impl?: (context: RemeshEventContext, arg: T) => U
  (arg: T): RemeshEventPayload<T, U>
  owner: RemeshDomainPayload<any, any>
  inspectable: boolean
}

export type RemeshEventPayload<T, U = T> = {
  type: 'RemeshEventPayload'
  arg: T
  Event: RemeshEvent<T, U>
}

export type RemeshEventOptions<T, U> = {
  name: string
  inspectable?: boolean
  impl: (context: RemeshEventContext, arg: T) => U
}

let eventUid = 0

export function RemeshEvent<T extends RemeshEventOptions<any, any>>(
  options: T,
): RemeshEvent<ExtractSecondArg<T['impl']>, ReturnType<T['impl']>>
export function RemeshEvent<T = void>(options: { name: string }): RemeshEvent<T>
export function RemeshEvent(options: RemeshEventOptions<unknown, unknown> | { name: string }): RemeshEvent<any, any> {
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
    Event.impl = options.impl
  }

  return Event
}

export type CompareFn<T> = (prev: T, curr: T) => boolean

export type RemeshStateChangedEventData<T> = {
  previous: T
  current: T
}

export type RemeshState<T, U> = {
  type: 'RemeshState'
  stateId: number
  stateName: string
  defer: boolean
  impl: (arg: T) => U
  (arg: T): RemeshStateItem<T, U>
  owner: RemeshDomainPayload<any, any>
  Query: RemeshQuery<T, U>
  compare: CompareFn<U>
  inspectable: boolean
}

export type RemeshStateItem<T, U> = {
  type: 'RemeshStateItem'
  arg: T
  State: RemeshState<T, U>
  new: (newState: U) => RemeshStatePayload<T, U>
}

export type RemeshDefaultStateOptions<T> = {
  name: RemeshState<void, T>['stateName']
  default: T
  inspectable?: boolean
  compare?: RemeshState<void, T>['compare']
}

export const RemeshDefaultState = <T>(options: RemeshDefaultStateOptions<T>): RemeshState<void, T> => {
  return RemeshState({
    name: options.name,
    impl: () => options.default,
    inspectable: options.inspectable,
    compare: options.compare,
  })
}

export type RemeshDeferStateOptions<T, U> = {
  name: RemeshState<T, U>['stateName']
  inspectable?: boolean
  compare?: RemeshState<T, U>['compare']
}

export const RemeshDeferState = <T, U>(options: RemeshDeferStateOptions<T, U>) => {
  return RemeshState({
    name: options.name,
    defer: true,
    impl: (_arg: T): U => {
      throw new Error(`RemeshDeferState: ${options.name} is not resolved`)
    },
    inspectable: options.inspectable,
    compare: options.compare,
  })
}

export type RemeshStatePayload<T, U> = {
  type: 'RemeshStateSetterPayload'
  stateItem: RemeshStateItem<T, U>
  newState: U
}

export type RemeshStateOptions<T, U> = {
  name: string
  defer?: boolean
  impl: (arg?: T) => U
  inspectable?: boolean
  compare?: CompareFn<U>
}

let stateUid = 0

export const defaultCompare = <T>(prev: T, curr: T) => {
  return shallowEqual(prev, curr)
}

export const RemeshState = <T extends RemeshStateOptions<any, any>>(
  options: T,
): RemeshState<ExtractFirstArg<T['impl']>, ReturnType<T['impl']>> => {
  const stateId = stateUid++

  type StateArg = ExtractFirstArg<T['impl']>
  type StateReturn = ReturnType<T['impl']>
  type StateItem = RemeshStateItem<StateArg, StateReturn>

  let cacheForNullary = null as StateItem | null

  const State = ((arg) => {
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
  }) as RemeshState<StateArg, StateReturn>

  State.type = 'RemeshState'
  State.stateId = stateId
  State.stateName = options.name
  State.impl = options.impl
  State.compare = options.compare ?? defaultCompare
  State.owner = DefaultDomain()
  State.inspectable = options.inspectable ?? true
  State.defer = options.defer ?? false

  State.Query = RemeshQuery({
    name: `${options.name}.Query`,
    inspectable: false,
    impl: ({ get }: RemeshQueryContext, arg: StateArg) => {
      return get(State(arg))
    },
  })

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
  owner: RemeshDomainPayload<any, any>
  compare: CompareFn<U>
  inspectable: boolean
}

export type RemeshQueryPayload<T, U> = {
  type: 'RemeshQueryPayload'
  Query: RemeshQuery<T, U>
  arg: T
}

export type RemeshQueryOptions<T, U> = {
  name: string
  inspectable?: boolean
  impl: (context: RemeshQueryContext, arg?: T) => U
  compare?: CompareFn<U>
}

let queryUid = 0
export const RemeshQuery = <T extends RemeshQueryOptions<any, any>>(
  options: T,
): RemeshQuery<ExtractSecondArg<T['impl']>, ReturnType<T['impl']>> => {
  const queryId = queryUid++

  /**
   * optimize for nullary query
   */
  let cacheForNullary: RemeshQueryPayload<ExtractSecondArg<T['impl']>, ReturnType<T['impl']>> | null = null

  const Query = ((arg) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const payload: RemeshQueryPayload<ExtractSecondArg<T['impl']>, ReturnType<T['impl']>> = {
      type: 'RemeshQueryPayload',
      Query,
      arg,
    }

    if (arg === undefined) {
      cacheForNullary = payload
    }

    return payload
  }) as RemeshQuery<ExtractSecondArg<T['impl']>, ReturnType<T['impl']>>

  Query.type = 'RemeshQuery'
  Query.queryId = queryId
  Query.queryName = options.name
  Query.impl = options.impl
  Query.compare = options.compare ?? defaultCompare
  Query.owner = DefaultDomain()
  Query.inspectable = options.inspectable ?? true

  return Query
}

export type RemeshCommandContext = {
  get: RemeshInjectedContext['get']
}

export type RemeshCommandOutput =
  | RemeshStatePayload<any, any>
  | RemeshEventPayload<any, any>
  | RemeshCommandPayload<any>
  | RemeshCommand$Payload<any>
  | RemeshCommandOutput[]
  | null

export type RemeshCommandPayload<T> = {
  type: 'RemeshCommandPayload'
  arg: T
  Command: RemeshCommand<T>
}

export type RemeshCommand<T = unknown> = {
  type: 'RemeshCommand'
  commandId: number
  commandName: string
  impl: (context: RemeshCommandContext, arg: T) => RemeshCommandOutput
  (arg: T): RemeshCommandPayload<T>
  owner: RemeshDomainPayload<any, any>
  inspectable: boolean
}

export type RemeshCommandOptions<T> = {
  name: string
  inspectable?: boolean
  impl: (context: RemeshCommandContext, arg?: T) => RemeshCommandOutput
}

let commandUid = 0

export const RemeshCommand = <T extends RemeshCommandOptions<any>>(
  options: T,
): RemeshCommand<ExtractSecondArg<T['impl']>> => {
  const commandId = commandUid++

  const Command = ((arg) => {
    return {
      type: 'RemeshCommandPayload',
      arg,
      Command,
    }
  }) as RemeshCommand<ExtractSecondArg<T['impl']>>

  Command.type = 'RemeshCommand'
  Command.commandId = commandId
  Command.commandName = options.name
  Command.impl = options.impl
  Command.owner = DefaultDomain()
  Command.inspectable = options.inspectable ?? true

  return Command
}

export type RemeshCommand$Context = {
  get: RemeshInjectedContext['get']
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
  command$Name: string
  impl: (context: RemeshCommand$Context, arg$: Observable<T>) => Observable<RemeshCommandOutput>
  (arg: T): RemeshCommand$Payload<T>
  owner: RemeshDomainPayload<any, any>
  inspectable: boolean
}

export type RemeshCommand$Options<T> = {
  name: string
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

export type RemeshCommandAsyncOptions<T> = {
  name: string
  inspectable?: boolean
  mode?: 'switch' | 'merge' | 'exhaust' | 'concat'
  impl: (domain: RemeshCommand$Context, arg?: T) => Promise<RemeshCommandOutput>
}

export const RemeshCommandAsync = <T extends RemeshCommandAsyncOptions<any>>(options: T) => {
  const Command$ = RemeshCommand$<ExtractSecondArg<T['impl']>>({
    name: options.name,
    inspectable: options.inspectable,
    impl: (context, arg$) => {
      if (!options.mode || options.mode === 'switch') {
        return arg$.pipe(switchMap((arg) => options.impl(context, arg)))
      }

      if (options.mode === 'merge') {
        return arg$.pipe(mergeMap((arg) => options.impl(context, arg)))
      }

      if (options.mode === 'concat') {
        return arg$.pipe(concatMap((arg) => options.impl(context, arg)))
      }

      if (options.mode === 'exhaust') {
        return arg$.pipe(exhaustMap((arg) => options.impl(context, arg)))
      }

      throw new Error(`RemeshCommandAsync: invalid mode: ${options.mode}`)
    },
  })

  return Command$
}

export type RemeshExternPayload<T> = {
  type: 'RemeshExternPayload'
  Extern: RemeshExtern<T>
  value: T
}

export type RemeshExtern<T> = {
  type: 'RemeshExtern'
  externName: string
  externId: number
  default: T
  (value: T): RemeshExternPayload<T>
}

export type RemeshExternOptions<T> = {
  name: RemeshExtern<T>['externName']
  default: RemeshExtern<T>['default']
}

let externUid = 0
export const RemeshExtern = <T = void>(options: RemeshExternOptions<T>): RemeshExtern<T> => {
  const Extern = ((value) => {
    return {
      type: 'RemeshExternPayload',
      Extern,
      value,
    }
  }) as RemeshExtern<T>

  Extern.externId = externUid++
  Extern.externName = options.name
  Extern.default = options.default

  return Extern
}

export type RemeshDomainContext = {
  // definitions
  state<T>(options: RemeshDefaultStateOptions<T>): RemeshState<void, T>
  state<T extends RemeshStateOptions<any, any>>(
    options: T,
  ): RemeshState<ExtractFirstArg<T['impl']>, ReturnType<T['impl']>>
  state<T, U>(options: RemeshDeferStateOptions<T, U>): RemeshState<Undefined2Void<T>, U>
  event: typeof RemeshEvent
  query: typeof RemeshQuery
  command: typeof RemeshCommand
  command$: typeof RemeshCommand$
  commandAsync: typeof RemeshCommandAsync
  // methods
  getDomain: <T extends RemeshDomainDefinition, Arg>(domainPayload: RemeshDomainPayload<T, Arg>) => T
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

export type RemeshDomain<T extends RemeshDomainDefinition, Arg> = {
  type: 'RemeshDomain'
  domainName: string
  domainId: number
  impl: (context: RemeshDomainContext, arg: Arg) => T
  (arg: Arg): RemeshDomainPayload<T, Arg>
  inspectable: boolean
}

export type RemeshDomainPayload<T extends RemeshDomainDefinition, Arg> = {
  type: 'RemeshDomainPayload'
  Domain: RemeshDomain<T, Arg>
  arg: Arg
}

export type RemeshDomainOptions<T extends RemeshDomainDefinition, Arg> = {
  name: string
  inspectable?: boolean
  impl: (context: RemeshDomainContext, arg?: Arg) => T
}

let domainUid = 0

export const RemeshDomain = <T extends RemeshDomainOptions<any, any>>(
  options: T,
): RemeshDomain<ReturnType<T['impl']>, ExtractSecondArg<T['impl']>> => {
  /**
   * optimize for nullary domain
   */
  let cacheForNullary: RemeshDomainPayload<ReturnType<T['impl']>, ExtractSecondArg<T['impl']>> | null = null

  const Domain: RemeshDomain<ReturnType<T['impl']>, ExtractSecondArg<T['impl']>> = ((arg) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary
    }

    const result: RemeshDomainPayload<ReturnType<T['impl']>, ExtractSecondArg<T['impl']>> = {
      type: 'RemeshDomainPayload',
      Domain,
      arg,
    }

    if (arg === undefined) {
      cacheForNullary = result
    }

    return result
  }) as RemeshDomain<ReturnType<T['impl']>, ExtractSecondArg<T['impl']>>

  Domain.type = 'RemeshDomain'
  Domain.domainId = domainUid++
  Domain.domainName = options.name
  Domain.impl = options.impl
  Domain.inspectable = options.inspectable ?? true

  return Domain
}

export const DefaultDomain: RemeshDomain<any, void> = RemeshDomain({
  name: 'DefaultDomain',
  impl: () => {
    return {}
  },
})
