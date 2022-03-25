import { Observable, switchMap, concatMap, mergeMap, exhaustMap } from 'rxjs';

import shallowEqual from 'shallowequal';

import { isPlainObject } from 'is-plain-object';

export type RemeshInjectedContext = {
  get: <T, U>(input: RemeshStateItem<T, U> | RemeshQueryPayload<T, U>) => U;
  fromEvent: <T, U>(Event: RemeshEvent<T, U>) => Observable<U>;
  fromQuery: <T, U>(Query: RemeshQueryPayload<T, U>) => Observable<U>;
};

export type RemeshEventContext = {
  get: RemeshInjectedContext['get'];
};

export type RemeshEvent<T, U> = {
  type: 'RemeshEvent';
  eventId: number;
  eventName: string;
  impl?: (context: RemeshEventContext, arg: T) => U;
  (arg: T): RemeshEventPayload<T, U>;
  owner?: RemeshDomainPayload<any, any>;
};

export type RemeshEventPayload<T, U = T> = {
  type: 'RemeshEventPayload';
  arg: T;
  Event: RemeshEvent<T, U>;
};

export type RemeshEventOptions<T, U> = {
  name: string;
  impl?: RemeshEvent<T, U>['impl'];
};

let eventUid = 0;

export const RemeshEvent = <T = void, U = T>(
  options: RemeshEventOptions<T, U>
): RemeshEvent<T, U> => {
  const eventId = eventUid++;

  const Event = ((arg) => {
    return {
      type: 'RemeshEventPayload',
      arg,
      Event: Event,
    };
  }) as RemeshEvent<T, U>;

  Event.type = 'RemeshEvent';
  Event.eventId = eventId;
  Event.eventName = options.name;
  Event.impl = options.impl;

  return Event;
};

export type CompareFn<T> = (prev: T, curr: T) => boolean;

export type RemeshState<T, U> = {
  type: 'RemeshState';
  stateId: number;
  stateName: string;
  impl: (arg: T) => U;
  (arg: T): RemeshStateItem<T, U>;
  owner?: RemeshDomainPayload<any, any>;
  Query: RemeshQuery<T, U>;
  compare: CompareFn<U>;
};

export type RemeshStateItem<T, U> = {
  type: 'RemeshStateItem';
  arg: T;
  State: RemeshState<T, U>;
  new: (newState: U) => RemeshStatePayload<T, U>;
};

export type RemeshDefaultStateOptions<T> = {
  name: RemeshState<void, T>['stateName'];
  default: T;
  compare?: RemeshState<void, T>['compare'];
};

export const RemeshDefaultState = <T>(
  options: RemeshDefaultStateOptions<T>
): RemeshState<void, T> => {
  return RemeshState({
    name: options.name,
    impl: () => options.default,
    compare: options.compare,
  });
};

export type RemeshStatePayload<T, U> = {
  type: 'RemeshStateSetterPayload';
  stateItem: RemeshStateItem<T, U>;
  newState: U;
};

export type RemeshStateOptions<T, U> = {
  name: RemeshState<T, U>['stateName'];
  impl: RemeshState<T, U>['impl'];
  compare?: RemeshState<T, U>['compare'];
};

let stateUid = 0;

export const defaultCompare = <T>(prev: T, curr: T) => {
  if (isPlainObject(prev) && isPlainObject(curr)) {
    return shallowEqual(prev, curr);
  }

  return prev === curr;
};

export const RemeshState = <U, T = void>(
  options: RemeshStateOptions<T, U>
): RemeshState<T, U> => {
  const stateId = stateUid++;

  let cacheForNullary = null as RemeshStateItem<T, U> | null;

  const State = ((arg) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary;
    }

    const stateItem: RemeshStateItem<T, U> = {
      type: 'RemeshStateItem',
      arg,
      State,
      new: (newState) => {
        return {
          type: 'RemeshStateSetterPayload',
          stateItem,
          newState,
        };
      },
    };

    if (arg === undefined) {
      cacheForNullary = stateItem;
    }

    return stateItem;
  }) as RemeshState<T, U>;

  State.type = 'RemeshState';
  State.stateId = stateId;
  State.stateName = options.name;
  State.impl = options.impl;
  State.compare = options.compare ?? defaultCompare;

  State.Query = RemeshQuery({
    name: `Query(${options.name})`,
    impl: ({ get }, arg) => {
      return get(State(arg));
    },
  });

  return State;
};

export type RemeshQueryContext = {
  get: RemeshInjectedContext['get'];
};

export type RemeshQuery<T, U> = {
  type: 'RemeshQuery';
  queryId: number;
  queryName: string;
  impl: (context: RemeshQueryContext, arg: T) => U;
  (arg: T): RemeshQueryPayload<T, U>;
  owner?: RemeshDomainPayload<any, any>;
  compare: CompareFn<U>;
};

export type RemeshQueryPayload<T, U> = {
  type: 'RemeshQueryPayload';
  Query: RemeshQuery<T, U>;
  arg: T;
};

export type RemeshQueryOptions<T, U> = {
  name: RemeshQuery<T, U>['queryName'];
  impl: RemeshQuery<T, U>['impl'];
  compare?: RemeshQuery<T, U>['compare'];
};

let queryUid = 0;
export const RemeshQuery = <U, T = void>(
  options: RemeshQueryOptions<T, U>
): RemeshQuery<T, U> => {
  const queryId = queryUid++;

  /**
   * optimize for nullary query
   */
  let cacheForNullary: RemeshQueryPayload<T, U> | null = null;

  const Query = ((arg) => {
    if (arg === undefined && cacheForNullary) {
      return cacheForNullary;
    }

    const payload: RemeshQueryPayload<T, U> = {
      type: 'RemeshQueryPayload',
      Query,
      arg,
    };

    if (arg === undefined) {
      cacheForNullary = payload;
    }

    return payload;
  }) as RemeshQuery<T, U>;

  Query.type = 'RemeshQuery';
  Query.queryId = queryId;
  Query.queryName = options.name;
  Query.impl = options.impl;
  Query.compare = options.compare ?? defaultCompare;

  return Query;
};

export type RemeshCommandContext = {
  get: RemeshInjectedContext['get'];
};

export type RemeshCommandOutput =
  | RemeshStatePayload<any, any>
  | RemeshEventPayload<any, any>
  | RemeshCommandPayload<any>
  | RemeshCommand$Payload<any>
  | RemeshCommandOutput[];

export type RemeshCommandPayload<T> = {
  type: 'RemeshCommandPayload';
  arg: T;
  Command: RemeshCommand<T>;
};

export type RemeshCommand<T = unknown> = {
  type: 'RemeshCommand';
  commandId: number;
  commandName: string;
  impl: (context: RemeshCommandContext, arg: T) => RemeshCommandOutput;
  (arg: T): RemeshCommandPayload<T>;
  owner?: RemeshDomainPayload<any, any>;
};

export type RemeshCommandOptions<T> = {
  name: RemeshCommand<T>['commandName'];
  impl: RemeshCommand<T>['impl'];
};

let commandUid = 0;

export const RemeshCommand = <T = void>(
  options: RemeshCommandOptions<T>
): RemeshCommand<T> => {
  const commandId = commandUid++;

  const Command = ((arg) => {
    return {
      type: 'RemeshCommandPayload',
      arg,
      Command: Command,
    };
  }) as RemeshCommand<T>;

  Command.type = 'RemeshCommand';
  Command.commandId = commandId;
  Command.commandName = options.name;
  Command.impl = options.impl;

  return Command;
};

export type RemeshCommand$Context = {
  get: RemeshInjectedContext['get'];
  fromEvent: RemeshInjectedContext['fromEvent'];
  fromQuery: RemeshInjectedContext['fromQuery'];
};

export type RemeshCommand$Payload<T> = {
  type: 'RemeshCommand$Payload';
  arg: T;
  Command$: RemeshCommand$<T>;
};

export type RemeshCommand$<T> = {
  type: 'RemeshCommand$';
  command$Id: number;
  command$Name: string;
  impl: (
    context: RemeshCommand$Context,
    arg$: Observable<T>
  ) => Observable<RemeshCommandOutput>;
  (arg: T): RemeshCommand$Payload<T>;
  owner?: RemeshDomainPayload<any, any>;
};

export type RemeshCommand$Options<T> = {
  name: RemeshCommand$<T>['command$Name'];
  impl: RemeshCommand$<T>['impl'];
};
let command$Uid = 0;

export const RemeshCommand$ = <T = void>(
  options: RemeshCommand$Options<T>
): RemeshCommand$<T> => {
  const command$Id = command$Uid++;

  const Command$ = ((arg) => {
    return {
      type: 'RemeshCommand$Payload',
      arg,
      Command$: Command$,
    };
  }) as RemeshCommand$<T>;

  Command$.type = 'RemeshCommand$';
  Command$.command$Id = command$Id;
  Command$.command$Name = options.name;
  Command$.impl = options.impl;

  return Command$;
};

export type RemeshCommandAsyncOptions<T> = {
  name: RemeshCommand$<T>['command$Name'];
  mode?: 'switch' | 'merge' | 'exhaust' | 'concat';
  impl: (domain: RemeshCommand$Context, arg: T) => Promise<RemeshCommandOutput>;
};

export const RemeshCommandAsync = <T = void>(
  options: RemeshCommandAsyncOptions<T>
) => {
  const Command$ = RemeshCommand$<T>({
    name: options.name,
    impl: (context, arg$) => {
      if (!options.mode || options.mode === 'switch') {
        return arg$.pipe(switchMap((arg) => options.impl(context, arg)));
      }

      if (options.mode === 'merge') {
        return arg$.pipe(mergeMap((arg) => options.impl(context, arg)));
      }

      if (options.mode === 'concat') {
        return arg$.pipe(concatMap((arg) => options.impl(context, arg)));
      }

      if (options.mode === 'exhaust') {
        return arg$.pipe(exhaustMap((arg) => options.impl(context, arg)));
      }

      throw new Error(`RemeshCommandAsync: invalid mode: ${options.mode}`);
    },
  });

  return Command$;
};

export type RemeshExternPayload<T> = {
  type: 'RemeshExternPayload';
  Extern: RemeshExtern<T>;
  value: T;
};

export type RemeshExtern<T> = {
  type: 'RemeshExtern';
  externName: string;
  externId: number;
  default: T;
  (value: T): RemeshExternPayload<T>;
};

export type RemeshExternOptions<T> = {
  name: RemeshExtern<T>['externName'];
  default: RemeshExtern<T>['default'];
};

let externUid = 0;
export const RemeshExtern = <T = void>(
  options: RemeshExternOptions<T>
): RemeshExtern<T> => {
  const Extern = ((value) => {
    return {
      type: 'RemeshExternPayload',
      Extern,
      value,
    };
  }) as RemeshExtern<T>;

  Extern.externId = externUid++;
  Extern.externName = options.name;
  Extern.default = options.default;

  return Extern;
};

export type RemeshDomainContext = {
  // definitions
  state<T>(options: RemeshDefaultStateOptions<T>): RemeshState<void, T>;
  state<T, U>(options: RemeshStateOptions<T, U>): RemeshState<T, U>;
  event: typeof RemeshEvent;
  query: typeof RemeshQuery;
  command: typeof RemeshCommand;
  command$: typeof RemeshCommand$;
  commandAsync: typeof RemeshCommandAsync;
  module: <T>(module: RemeshModule<T>) => T;
  // methods
  getDomain: <T extends RemeshDomainDefinition, Arg>(
    domainPayload: RemeshDomainPayload<T, Arg>
  ) => T;
  getExtern: <T>(Extern: RemeshExtern<T>) => T;
};

export type RemeshDomainOutput = {
  event: {
    [key: string]: RemeshEvent<any, any>;
  };
  query: {
    [key: string]: RemeshQuery<any, any>;
  };
  command: {
    [key: string]: RemeshCommand<any> | RemeshCommand$<any>;
  };
};

export type RemeshDomainDefinition = Partial<RemeshDomainOutput>;

export type RemeshDomain<T extends RemeshDomainDefinition, Arg> = {
  type: 'RemeshDomain';
  domainName: string;
  domainId: number;
  impl: (context: RemeshDomainContext, arg: Arg) => T;
  (arg: Arg): RemeshDomainPayload<T, Arg>;
};

export type RemeshDomainPayload<T extends RemeshDomainDefinition, Arg> = {
  type: 'RemeshDomainPayload';
  Domain: RemeshDomain<T, Arg>;
  arg: Arg;
};

export type RemeshDomainOptions<T extends RemeshDomainDefinition, Arg> = {
  name: RemeshDomain<T, Arg>['domainName'];
  impl: RemeshDomain<T, Arg>['impl'];
};

let domainUid = 0;

export const RemeshDomain = <T extends RemeshDomainDefinition, Arg = void>(
  options: RemeshDomainOptions<T, Arg>
): RemeshDomain<T, Arg> => {
  /**
   * optimize for nullary domain
   */
  let cacheForNullary: RemeshDomainPayload<T, Arg> | null = null;

  const Domain: RemeshDomain<T, Arg> = ((arg) => {
    if (arg === undefined) {
      if (cacheForNullary) {
        return cacheForNullary;
      }
    }

    const result: RemeshDomainPayload<T, Arg> = {
      type: 'RemeshDomainPayload',
      Domain,
      arg,
    };

    if (arg === undefined) {
      cacheForNullary = result;
    }

    return result;
  }) as RemeshDomain<T, Arg>;

  Object.assign(Domain, {
    type: 'RemeshDomain',
    domainId: domainUid++,
    domainName: options.name,
    impl: options.impl,
  });

  return Domain;
};

export type RemeshModule<T> = (context: RemeshDomainContext) => T;

export const RemeshModule = <T>(impl: RemeshModule<T>) => {
  return impl;
};
