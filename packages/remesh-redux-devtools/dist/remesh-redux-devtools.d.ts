import { RemeshDomainPayload, RemeshStoreOptions } from 'remesh';
import { RemeshDebugOptions } from 'remesh-debugger-helper';
export declare type RemeshReduxDevtoolsOptions = RemeshDebugOptions;
export declare const RemeshReduxDevtools: (options?: RemeshDebugOptions | undefined) => ((storeOptions: RemeshStoreOptions) => {
    name: string | undefined;
    getDomain: <T_2 extends Partial<import("remesh").RemeshDomainOutput>, Arg>(domainPayload: RemeshDomainPayload<T_2, Arg>) => import("remesh").BindingDomainOutput<T_2>;
    query: <T_3, U>(queryPayload: import("remesh").RemeshQueryPayload<T_3, U>) => U;
    emitEvent: <T_4, U_1>(eventPayload: import("remesh").RemeshEventPayload<T_4, U_1>) => void;
    sendCommand: <T_5>(input: import("remesh").RemeshCommandPayload<T_5> | import("remesh").RemeshCommand$Payload<T_5>) => void;
    destroy: () => void;
    subscribeQuery: <T_6, U_2>(queryPayload: import("remesh").RemeshQueryPayload<T_6, U_2>, subscriber: Partial<import("rxjs").Observer<U_2>> | ((data: U_2) => unknown)) => import("rxjs").Subscription;
    subscribeEvent: <T_7, U_3 = T_7>(Event: import("remesh").RemeshEvent<T_7, U_3>, subscriber: (event: U_3) => unknown) => import("rxjs").Subscription;
    subscribeDomain: <T_8 extends Partial<import("remesh").RemeshDomainOutput>, Arg_1>(domainPayload: RemeshDomainPayload<T_8, Arg_1>) => import("rxjs").Subscription;
    getKey: <T_9, U_4>(input: import("remesh").RemeshStateItem<T_9, U_4> | import("remesh").RemeshQueryPayload<T_9, U_4> | RemeshDomainPayload<T_9, U_4>) => string;
}) | undefined;
