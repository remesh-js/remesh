import { RemeshDomain, RemeshExtern, RemeshState, RemeshQuery, RemeshCommand, RemeshCommand$ } from './remesh';
export * from './remesh';
export * from './store';
export * from './inspector';
export declare const Remesh: {
    domain: <T extends import("./remesh").RemeshDomainOptions<any, any>>(options: T) => RemeshDomain<ReturnType<T["impl"]>, import("./remesh").Undefined2Void<Parameters<T["impl"]>[1]>>;
    extern: <T_1 = void>(options: import("./remesh").RemeshExternOptions<T_1>) => RemeshExtern<T_1>;
    store: (options: import("./store").RemeshStoreOptions) => {
        name: string | undefined;
        getDomain: <T_2 extends Partial<import("./remesh").RemeshDomainOutput>, Arg>(domainPayload: import("./remesh").RemeshDomainPayload<T_2, Arg>) => import("./store").BindingDomainOutput<T_2>;
        query: <T_3, U>(queryPayload: import("./remesh").RemeshQueryPayload<T_3, U>) => U;
        emitEvent: <T_4, U_1>(eventPayload: import("./remesh").RemeshEventPayload<T_4, U_1>) => void;
        sendCommand: <T_5>(input: import("./remesh").RemeshCommandPayload<T_5> | import("./remesh").RemeshCommand$Payload<T_5>) => void;
        destroy: () => void;
        subscribeQuery: <T_6, U_2>(queryPayload: import("./remesh").RemeshQueryPayload<T_6, U_2>, subscriber: (data: U_2) => unknown) => import("rxjs").Subscription;
        subscribeEvent: <T_7, U_3 = T_7>(Event: import("./remesh").RemeshEvent<T_7, U_3>, subscriber: (event: U_3) => unknown) => import("rxjs").Subscription;
        subscribeDomain: <T_8 extends Partial<import("./remesh").RemeshDomainOutput>, Arg_1>(domainPayload: import("./remesh").RemeshDomainPayload<T_8, Arg_1>) => import("rxjs").Subscription;
        getKey: <T_9, U_4>(input: import("./remesh").RemeshStateItem<T_9, U_4> | import("./remesh").RemeshQueryPayload<T_9, U_4> | import("./remesh").RemeshDomainPayload<T_9, U_4>) => string;
    };
    state: <T_10 extends import("./remesh").RemeshStateOptions<any, any>>(options: T_10) => RemeshState<import("./remesh").Undefined2Void<Parameters<T_10["impl"]>[0]>, ReturnType<T_10["impl"]>>;
    query: <T_11 extends import("./remesh").RemeshQueryOptions<any, any>>(options: T_11) => RemeshQuery<import("./remesh").Undefined2Void<Parameters<T_11["impl"]>[1]>, ReturnType<T_11["impl"]>>;
    command: <T_12 extends import("./remesh").RemeshCommandOptions<any>>(options: T_12) => RemeshCommand<import("./remesh").Undefined2Void<Parameters<T_12["impl"]>[1]>>;
    command$: <T_13 = void>(options: import("./remesh").RemeshCommand$Options<T_13>) => RemeshCommand$<T_13>;
    commandAsync: <T_14 extends import("./remesh").RemeshCommandAsyncOptions<any>>(options: T_14) => RemeshCommand$<import("./remesh").Undefined2Void<Parameters<T_14["impl"]>[1]>>;
};
