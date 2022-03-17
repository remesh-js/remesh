import { Observable } from 'rxjs';

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
  ownerDomain?: RemeshDomain<any>;
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
  ownerDomain?: RemeshDomain<any>;
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
  cacheOptions?: CacheOptions;
};

export const RemeshDefaultState = <T>(
  options: RemeshDefaultStateOptions<T>
): RemeshState<void, T> => {
  return RemeshState({
    name: options.name,
    impl: () => options.default,
    compare: options.compare,
    cacheOptions: options.cacheOptions,
  });
};

export type RemeshStatePayload<T, U> = {
  type: 'RemeshStateSetterPayload';
  stateItem: RemeshStateItem<T, U>;
  newState: U;
};

export type CacheOptions = {
  max: number;
};

export type RemeshStateOptions<T, U> = {
  name: RemeshState<T, U>['stateName'];
  impl: RemeshState<T, U>['impl'];
  compare?: RemeshState<T, U>['compare'];
  cacheOptions?: CacheOptions;
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
  ownerDomain?: RemeshDomain<any>;
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
  Domain?: RemeshDomain<any>;
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
  Domain?: RemeshDomain<any>;
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
  module: <T>(module: RemeshModule<T>) => T;
  // methods
  getDomain: <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>) => T;
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

export type RemeshDomain<T extends RemeshDomainDefinition> = {
  type: 'RemeshDomain';
  domainName: string;
  domainId: number;
  impl: (context: RemeshDomainContext) => T;
};

export type RemeshDomainOptions<T> = {
  name: RemeshDomain<T>['domainName'];
  impl: RemeshDomain<T>['impl'];
};

let domainUid = 0;

export const RemeshDomain = <T extends RemeshDomainDefinition>(
  options: RemeshDomainOptions<T>
): RemeshDomain<T> => {
  const Domain: RemeshDomain<T> = {
    type: 'RemeshDomain',
    domainId: domainUid++,
    domainName: options.name,
    impl: options.impl,
  };

  return Domain;
};

export type RemeshModule<T> = (context: RemeshDomainContext) => T;

export const RemeshModule = <T>(impl: RemeshModule<T>) => {
  return impl;
};
