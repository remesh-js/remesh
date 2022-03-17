import { Observable, Subscription } from 'rxjs';
declare type RemeshInjectedContext = {
    get: <T, U>(input: RemeshStateItem<T, U> | RemeshQueryPayload<T, U>) => U;
    fromEvent: <T, U>(Event: RemeshEvent<T, U>) => Observable<U>;
    fromQuery: <T, U>(Query: RemeshQueryPayload<T, U>) => Observable<U>;
};
export declare type RemeshEventContext = {
    get: RemeshInjectedContext['get'];
};
export declare type RemeshEvent<T, U> = {
    type: 'RemeshEvent';
    eventId: number;
    eventName: string;
    impl?: (context: RemeshEventContext, arg: T) => U;
    (arg: T): RemeshEventPayload<T, U>;
    ownerDomain?: RemeshDomain<any>;
};
export declare type RemeshEventPayload<T, U = T> = {
    type: 'RemeshEventPayload';
    arg: T;
    Event: RemeshEvent<T, U>;
};
export declare type RemeshEventOptions<T, U> = {
    name: string;
    impl?: RemeshEvent<T, U>['impl'];
};
export declare const RemeshEvent: <T = void, U = T>(options: RemeshEventOptions<T, U>) => RemeshEvent<T, U>;
export declare type CompareFn<T> = (prev: T, curr: T) => boolean;
export declare type RemeshState<T, U> = {
    type: 'RemeshState';
    stateId: number;
    stateName: string;
    impl: (arg: T) => U;
    (arg: T): RemeshStateItem<T, U>;
    ownerDomain?: RemeshDomain<any>;
    Query: RemeshQuery<T, U>;
    compare: CompareFn<U>;
};
export declare type RemeshStateItem<T, U> = {
    type: 'RemeshStateItem';
    arg: T;
    State: RemeshState<T, U>;
    new: (newState: U) => RemeshStatePayload<T, U>;
};
export declare type RemeshDefaultStateOptions<T> = {
    name: RemeshState<void, T>['stateName'];
    default: T;
    compare?: RemeshState<void, T>['compare'];
    cacheOptions?: CacheOptions;
};
export declare const RemeshDefaultState: <T>(options: RemeshDefaultStateOptions<T>) => RemeshState<void, T>;
export declare type RemeshStatePayload<T, U> = {
    type: 'RemeshStateSetterPayload';
    stateItem: RemeshStateItem<T, U>;
    newState: U;
};
export declare type CacheOptions = {
    max: number;
};
export declare type RemeshStateOptions<T, U> = {
    name: RemeshState<T, U>['stateName'];
    impl: RemeshState<T, U>['impl'];
    compare?: RemeshState<T, U>['compare'];
    cacheOptions?: CacheOptions;
};
export declare const defaultCompare: <T>(prev: T, curr: T) => boolean;
export declare const RemeshState: <U, T = void>(options: RemeshStateOptions<T, U>) => RemeshState<T, U>;
export declare type RemeshQueryContext = {
    get: RemeshInjectedContext['get'];
};
export declare type RemeshQuery<T, U> = {
    type: 'RemeshQuery';
    queryId: number;
    queryName: string;
    impl: (context: RemeshQueryContext, arg: T) => U;
    (arg: T): RemeshQueryPayload<T, U>;
    ownerDomain?: RemeshDomain<any>;
    compare: CompareFn<U>;
};
export declare type RemeshQueryPayload<T, U> = {
    type: 'RemeshQueryPayload';
    Query: RemeshQuery<T, U>;
    arg: T;
};
export declare type RemeshQueryOptions<T, U> = {
    name: RemeshQuery<T, U>['queryName'];
    impl: RemeshQuery<T, U>['impl'];
    compare?: RemeshQuery<T, U>['compare'];
};
export declare const RemeshQuery: <U, T = void>(options: RemeshQueryOptions<T, U>) => RemeshQuery<T, U>;
export declare type RemeshCommandContext = {
    get: RemeshInjectedContext['get'];
};
export declare type RemeshCommandOutput = RemeshStatePayload<any, any> | RemeshEventPayload<any, any> | RemeshCommandPayload<any> | RemeshCommand$Payload<any> | RemeshCommandOutput[];
export declare type RemeshCommandPayload<T> = {
    type: 'RemeshCommandPayload';
    arg: T;
    Command: RemeshCommand<T>;
};
export declare type RemeshCommand<T = unknown> = {
    type: 'RemeshCommand';
    commandId: number;
    commandName: string;
    impl: (context: RemeshCommandContext, arg: T) => RemeshCommandOutput;
    (arg: T): RemeshCommandPayload<T>;
    Domain?: RemeshDomain<any>;
};
export declare type RemeshCommandOptions<T> = {
    name: RemeshCommand<T>['commandName'];
    impl: RemeshCommand<T>['impl'];
};
export declare const RemeshCommand: <T = void>(options: RemeshCommandOptions<T>) => RemeshCommand<T>;
export declare type RemeshCommand$Context = {
    get: RemeshInjectedContext['get'];
    fromEvent: RemeshInjectedContext['fromEvent'];
    fromQuery: RemeshInjectedContext['fromQuery'];
};
export declare type RemeshCommand$Payload<T> = {
    type: 'RemeshCommand$Payload';
    arg: T;
    Command$: RemeshCommand$<T>;
};
export declare type RemeshCommand$<T> = {
    type: 'RemeshCommand$';
    command$Id: number;
    command$Name: string;
    impl: (context: RemeshCommand$Context, arg$: Observable<T>) => Observable<RemeshCommandOutput>;
    (arg: T): RemeshCommand$Payload<T>;
    Domain?: RemeshDomain<any>;
};
export declare type RemeshCommand$Options<T> = {
    name: RemeshCommand$<T>['command$Name'];
    impl: RemeshCommand$<T>['impl'];
};
export declare const RemeshCommand$: <T = void>(options: RemeshCommand$Options<T>) => RemeshCommand$<T>;
export declare type RemeshExternPayload<T> = {
    type: 'RemeshExternPayload';
    Extern: RemeshExtern<T>;
    value: T;
};
export declare type RemeshExtern<T> = {
    type: 'RemeshExtern';
    externName: string;
    externId: number;
    default: T;
    (value: T): RemeshExternPayload<T>;
};
export declare type RemeshExternOptions<T> = {
    name: RemeshExtern<T>['externName'];
    default: RemeshExtern<T>['default'];
};
export declare const RemeshExtern: <T = void>(options: RemeshExternOptions<T>) => RemeshExtern<T>;
export declare type RemeshDomainContext = {
    state<T>(options: RemeshDefaultStateOptions<T>): RemeshState<void, T>;
    state<T, U>(options: RemeshStateOptions<T, U>): RemeshState<T, U>;
    event: typeof RemeshEvent;
    query: typeof RemeshQuery;
    command: typeof RemeshCommand;
    command$: typeof RemeshCommand$;
    module: <T>(module: RemeshModule<T>) => T;
    getDomain: <T extends RemeshDomainDefinition>(Domain: RemeshDomain<T>) => T;
    getExtern: <T>(Extern: RemeshExtern<T>) => T;
};
export declare type RemeshDomainOutput = {
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
export declare type RemeshDomainDefinition = Partial<RemeshDomainOutput>;
export declare type RemeshDomain<T extends RemeshDomainDefinition> = {
    type: 'RemeshDomain';
    domainName: string;
    domainId: number;
    impl: (context: RemeshDomainContext) => T;
};
export declare type RemeshDomainOptions<T> = {
    name: RemeshDomain<T>['domainName'];
    impl: RemeshDomain<T>['impl'];
};
export declare const RemeshDomain: <T extends Partial<RemeshDomainOutput>>(options: RemeshDomainOptions<T>) => RemeshDomain<T>;
export declare type RemeshModule<T> = (context: RemeshDomainContext) => T;
export declare const RemeshModule: <T>(impl: RemeshModule<T>) => RemeshModule<T>;
export declare type RemeshStore = ReturnType<typeof RemeshStore>;
export declare type RemeshStoreOptions = {
    name: string;
    externs?: RemeshExternPayload<any>[];
};
export declare const RemeshStore: (options: RemeshStoreOptions) => {
    name: string;
    getDomain: <T extends Partial<RemeshDomainOutput>>(Domain: RemeshDomain<T>) => T & {
        command: (T["command"] extends {} ? { [key in keyof T["command"]]: (...args: Parameters<T["command"][key]>) => void; } : never) | undefined;
    };
    query: <T_1, U>(queryPayload: RemeshQueryPayload<T_1, U>) => U;
    emitEvent: <T_2, U_1>(eventPayload: RemeshEventPayload<T_2, U_1>) => void;
    emitCommand: <T_3>(input: RemeshCommandPayload<T_3> | RemeshCommand$Payload<T_3>) => void;
    destroy: () => void;
    subscribeQuery: <T_4, U_2>(queryPayload: RemeshQueryPayload<T_4, U_2>, subscriber: (data: U_2) => unknown) => Subscription;
    subscribeEvent: <T_5, U_3 = T_5>(Event: RemeshEvent<T_5, U_3>, subscriber: (event: U_3) => unknown) => Subscription;
    subscribeDomain: <T_6 extends Partial<RemeshDomainOutput>>(Domain: RemeshDomain<T_6>) => Subscription;
    getKey: <T_7, U_4>(stateItem: RemeshStateItem<T_7, U_4> | RemeshQueryPayload<T_7, U_4>) => string;
};
export declare const Remesh: {
    domain: <T extends Partial<RemeshDomainOutput>>(options: RemeshDomainOptions<T>) => RemeshDomain<T>;
    module: <T_1>(impl: RemeshModule<T_1>) => RemeshModule<T_1>;
    extern: <T_2 = void>(options: RemeshExternOptions<T_2>) => RemeshExtern<T_2>;
    store: (options: RemeshStoreOptions) => {
        name: string;
        getDomain: <T extends Partial<RemeshDomainOutput>>(Domain: RemeshDomain<T>) => T & {
            command: (T["command"] extends {} ? { [key in keyof T["command"]]: (...args: Parameters<T["command"][key]>) => void; } : never) | undefined;
        };
        query: <T_1, U>(queryPayload: RemeshQueryPayload<T_1, U>) => U;
        emitEvent: <T_2, U_1>(eventPayload: RemeshEventPayload<T_2, U_1>) => void;
        emitCommand: <T_3>(input: RemeshCommandPayload<T_3> | RemeshCommand$Payload<T_3>) => void;
        destroy: () => void;
        subscribeQuery: <T_4, U_2>(queryPayload: RemeshQueryPayload<T_4, U_2>, subscriber: (data: U_2) => unknown) => Subscription;
        subscribeEvent: <T_5, U_3 = T_5>(Event: RemeshEvent<T_5, U_3>, subscriber: (event: U_3) => unknown) => Subscription;
        subscribeDomain: <T_6 extends Partial<RemeshDomainOutput>>(Domain: RemeshDomain<T_6>) => Subscription;
        getKey: <T_7, U_4>(stateItem: RemeshStateItem<T_7, U_4> | RemeshQueryPayload<T_7, U_4>) => string;
    };
};
export {};
