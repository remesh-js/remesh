import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { RemeshCommand$, RemeshCommand$Payload, RemeshCommandPayload, RemeshDomain, RemeshDomainDefinition, RemeshDomainPayload, RemeshEvent, RemeshEventPayload, RemeshExtern, RemeshExternPayload, RemeshQuery, RemeshQueryPayload, RemeshState, RemeshStateItem } from './remesh';
export declare type RemeshStore = ReturnType<typeof RemeshStore>;
export declare const StateValuePlaceholder: unique symbol;
export declare type RemeshStateStorage<T, U> = {
    id: number;
    type: 'RemeshStateStorage';
    State: RemeshState<T, U>;
    arg: T;
    key: string;
    currentState: U | typeof StateValuePlaceholder;
    downstreamSet: Set<RemeshQueryStorage<any, any>>;
};
export declare type RemeshQueryStorage<T, U> = {
    id: number;
    type: 'RemeshQueryStorage';
    Query: RemeshQuery<T, U>;
    arg: T;
    key: string;
    currentValue: U;
    upstreamSet: Set<RemeshQueryStorage<any, any> | RemeshStateStorage<any, any>>;
    downstreamSet: Set<RemeshQueryStorage<any, any>>;
    subject: Subject<U>;
    observable: Observable<U>;
    refCount: number;
};
export declare type RemeshEventStorage<T = unknown, U = T> = {
    id: number;
    type: 'RemeshEventStorage';
    Event: RemeshEvent<T, U>;
    subject: Subject<U>;
    observable: Observable<U>;
    refCount: number;
};
export declare type RemeshCommand$Storage<T> = {
    id: number;
    type: 'RemeshCommand$Storage';
    Command$: RemeshCommand$<T>;
    subject: Subject<T>;
    observable: Observable<T>;
    subscription?: Subscription;
};
export declare type RemeshDomainStorage<T extends RemeshDomainDefinition, Arg> = {
    id: number;
    type: 'RemeshDomainStorage';
    Domain: RemeshDomain<T, Arg>;
    arg: Arg;
    key: string;
    domain: T;
    domainOutput?: BindingDomainOutput<T>;
    domainPayload: RemeshDomainPayload<T, Arg>;
    upstreamSet: Set<RemeshDomainStorage<any, any>>;
    downstreamSet: Set<RemeshDomainStorage<any, any>>;
    domainSubscriptionSet: Set<Subscription>;
    upstreamSubscriptionSet: Set<Subscription>;
    command$Set: Set<RemeshCommand$<any>>;
    stateMap: Map<string, RemeshStateStorage<any, any>>;
    queryMap: Map<string, RemeshQueryStorage<any, any>>;
    eventMap: Map<RemeshEvent<any, any>, RemeshEventStorage<any, any>>;
    command$Map: Map<RemeshCommand$<any>, RemeshCommand$Storage<any>>;
    refCount: number;
    running: boolean;
};
export declare type RemeshExternStorage<T> = {
    id: number;
    type: 'RemeshExternStorage';
    Extern: RemeshExtern<T>;
    currentValue: T;
};
export declare type RemeshStoreInspector = typeof RemeshStore;
export declare type RemeshStoreOptions = {
    name?: string;
    externs?: RemeshExternPayload<any>[];
    inspectors?: (RemeshStoreInspector | false | undefined | null)[];
};
export declare type BindingCommand<T extends RemeshDomainDefinition['command']> = T extends {} ? {
    [key in keyof T]: (...args: Parameters<T[key]>) => void;
} : never;
export declare type BindingDomainOutput<T extends RemeshDomainDefinition> = Omit<T, 'command'> & {
    command: BindingCommand<T['command']>;
};
export declare const RemeshStore: (options: RemeshStoreOptions) => {
    name: string | undefined;
    getDomain: <T extends Partial<import("./remesh").RemeshDomainOutput>, Arg>(domainPayload: RemeshDomainPayload<T, Arg>) => BindingDomainOutput<T>;
    query: <T_1, U>(queryPayload: RemeshQueryPayload<T_1, U>) => U;
    emitEvent: <T_2, U_1>(eventPayload: RemeshEventPayload<T_2, U_1>) => void;
    sendCommand: <T_3>(input: RemeshCommandPayload<T_3> | RemeshCommand$Payload<T_3>) => void;
    destroy: () => void;
    subscribeQuery: <T_4, U_2>(queryPayload: RemeshQueryPayload<T_4, U_2>, subscriber: Partial<Observer<U_2>> | ((data: U_2) => unknown)) => Subscription;
    subscribeEvent: <T_5, U_3 = T_5>(Event: RemeshEvent<T_5, U_3>, subscriber: (event: U_3) => unknown) => Subscription;
    subscribeDomain: <T_6 extends Partial<import("./remesh").RemeshDomainOutput>, Arg_1>(domainPayload: RemeshDomainPayload<T_6, Arg_1>) => Subscription;
    getKey: <T_7, U_4>(input: RemeshStateItem<T_7, U_4> | RemeshQueryPayload<T_7, U_4> | RemeshDomainPayload<T_7, U_4>) => string;
};
