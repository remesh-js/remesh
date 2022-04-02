import { Observable } from 'rxjs';
export declare type Undefined2Void<T> = undefined extends T ? Exclude<T, undefined> | void : T;
export declare const undefined2Void: <T>(value: T) => Undefined2Void<T>;
export declare type ExtractFirstArg<T extends (...args: any) => any> = Undefined2Void<Parameters<T>[0]>;
export declare type ExtractSecondArg<T extends (...args: any) => any> = Undefined2Void<Parameters<T>[1]>;
export declare type RemeshInjectedContext = {
    get: <T, U>(input: RemeshStateItem<T, U> | RemeshQueryPayload<T, U>) => U;
    fromEvent: <T, U>(Event: RemeshEvent<T, U>) => Observable<U>;
    fromQuery: <T, U>(Query: RemeshQueryPayload<T, U>) => Observable<U>;
};
export declare type RemeshEventContext = {
    get: RemeshInjectedContext['get'];
};
export declare type RemeshEvent<T, U = T> = {
    type: 'RemeshEvent';
    eventId: number;
    eventName: string;
    impl?: (context: RemeshEventContext, arg: T) => U;
    (arg: T): RemeshEventPayload<T, U>;
    owner: RemeshDomainPayload<any, any>;
    inspectable: boolean;
};
export declare type RemeshEventPayload<T, U = T> = {
    type: 'RemeshEventPayload';
    arg: T;
    Event: RemeshEvent<T, U>;
};
export declare type RemeshEventOptions<T, U> = {
    name: string;
    inspectable?: boolean;
    impl: (context: RemeshEventContext, arg: T) => U;
};
export declare function RemeshEvent<T extends RemeshEventOptions<any, any>>(options: T): RemeshEvent<ExtractSecondArg<T['impl']>, ReturnType<T['impl']>>;
export declare function RemeshEvent<T = void>(options: {
    name: string;
}): RemeshEvent<T>;
export declare type CompareFn<T> = (prev: T, curr: T) => boolean;
export declare type RemeshStateChangedEventData<T> = {
    previous: T;
    current: T;
};
export declare type RemeshState<T, U> = {
    type: 'RemeshState';
    stateId: number;
    stateName: string;
    defer: boolean;
    impl: (arg: T) => U;
    (arg: T): RemeshStateItem<T, U>;
    owner: RemeshDomainPayload<any, any>;
    Query: RemeshQuery<T, U>;
    compare: CompareFn<U>;
    inspectable: boolean;
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
    inspectable?: boolean;
    compare?: RemeshState<void, T>['compare'];
};
export declare const RemeshDefaultState: <T>(options: RemeshDefaultStateOptions<T>) => RemeshState<void, T>;
export declare type RemeshDeferStateOptions<T, U> = {
    name: RemeshState<T, U>['stateName'];
    inspectable?: boolean;
    compare?: RemeshState<T, U>['compare'];
};
export declare const RemeshDeferState: <T, U>(options: RemeshDeferStateOptions<T, U>) => RemeshState<Undefined2Void<T>, U>;
export declare type RemeshStatePayload<T, U> = {
    type: 'RemeshStateSetterPayload';
    stateItem: RemeshStateItem<T, U>;
    newState: U;
};
export declare type RemeshStateOptions<T, U> = {
    name: string;
    defer?: boolean;
    impl: (arg?: T) => U;
    inspectable?: boolean;
    compare?: CompareFn<U>;
};
export declare const defaultCompare: <T>(prev: T, curr: T) => boolean;
export declare const RemeshState: <T extends RemeshStateOptions<any, any>>(options: T) => RemeshState<Undefined2Void<Parameters<T["impl"]>[0]>, ReturnType<T["impl"]>>;
export declare type RemeshQueryContext = {
    get: RemeshInjectedContext['get'];
};
export declare type RemeshQuery<T, U> = {
    type: 'RemeshQuery';
    queryId: number;
    queryName: string;
    impl: (context: RemeshQueryContext, arg: T) => U;
    (arg: T): RemeshQueryPayload<T, U>;
    owner: RemeshDomainPayload<any, any>;
    compare: CompareFn<U>;
    inspectable: boolean;
};
export declare type RemeshQueryPayload<T, U> = {
    type: 'RemeshQueryPayload';
    Query: RemeshQuery<T, U>;
    arg: T;
};
export declare type RemeshQueryOptions<T, U> = {
    name: string;
    inspectable?: boolean;
    impl: (context: RemeshQueryContext, arg?: T) => U;
    compare?: CompareFn<U>;
};
export declare const RemeshQuery: <T extends RemeshQueryOptions<any, any>>(options: T) => RemeshQuery<Undefined2Void<Parameters<T["impl"]>[1]>, ReturnType<T["impl"]>>;
export declare type RemeshCommandContext = {
    get: RemeshInjectedContext['get'];
};
export declare type RemeshCommandOutput = RemeshStatePayload<any, any> | RemeshEventPayload<any, any> | RemeshCommandPayload<any> | RemeshCommand$Payload<any> | RemeshCommandOutput[] | null;
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
    owner: RemeshDomainPayload<any, any>;
    inspectable: boolean;
};
export declare type RemeshCommandOptions<T> = {
    name: string;
    inspectable?: boolean;
    impl: (context: RemeshCommandContext, arg?: T) => RemeshCommandOutput;
};
export declare const RemeshCommand: <T extends RemeshCommandOptions<any>>(options: T) => RemeshCommand<Undefined2Void<Parameters<T["impl"]>[1]>>;
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
    owner: RemeshDomainPayload<any, any>;
    inspectable: boolean;
};
export declare type RemeshCommand$Options<T> = {
    name: string;
    inspectable?: boolean;
    impl: RemeshCommand$<T>['impl'];
};
export declare const RemeshCommand$: <T = void>(options: RemeshCommand$Options<T>) => RemeshCommand$<T>;
export declare type RemeshCommandAsyncOptions<T> = {
    name: string;
    inspectable?: boolean;
    mode?: 'switch' | 'merge' | 'exhaust' | 'concat';
    impl: (domain: RemeshCommand$Context, arg?: T) => Promise<RemeshCommandOutput>;
};
export declare const RemeshCommandAsync: <T extends RemeshCommandAsyncOptions<any>>(options: T) => RemeshCommand$<Undefined2Void<Parameters<T["impl"]>[1]>>;
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
    state<T extends RemeshStateOptions<any, any>>(options: T): RemeshState<ExtractFirstArg<T['impl']>, ReturnType<T['impl']>>;
    state<T, U>(options: RemeshDeferStateOptions<T, U>): RemeshState<Undefined2Void<T>, U>;
    event: typeof RemeshEvent;
    query: typeof RemeshQuery;
    command: typeof RemeshCommand;
    command$: typeof RemeshCommand$;
    commandAsync: typeof RemeshCommandAsync;
    getDomain: <T extends RemeshDomainDefinition, Arg>(domainPayload: RemeshDomainPayload<T, Arg>) => T;
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
export declare type RemeshDomain<T extends RemeshDomainDefinition, Arg> = {
    type: 'RemeshDomain';
    domainName: string;
    domainId: number;
    impl: (context: RemeshDomainContext, arg: Arg) => T;
    (arg: Arg): RemeshDomainPayload<T, Arg>;
    inspectable: boolean;
};
export declare type RemeshDomainPayload<T extends RemeshDomainDefinition, Arg> = {
    type: 'RemeshDomainPayload';
    Domain: RemeshDomain<T, Arg>;
    arg: Arg;
};
export declare type RemeshDomainOptions<T extends RemeshDomainDefinition, Arg> = {
    name: string;
    inspectable?: boolean;
    impl: (context: RemeshDomainContext, arg?: Arg) => T;
};
export declare const RemeshDomain: <T extends RemeshDomainOptions<any, any>>(options: T) => RemeshDomain<ReturnType<T["impl"]>, Undefined2Void<Parameters<T["impl"]>[1]>>;
export declare const DefaultDomain: RemeshDomain<any, void>;
