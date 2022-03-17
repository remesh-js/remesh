import { RemeshDomain, RemeshModule, RemeshExtern } from './remesh';
export * from './remesh';
export declare const Remesh: {
    domain: <T extends Partial<import("./remesh").RemeshDomainOutput>>(options: import("./remesh").RemeshDomainOptions<T>) => RemeshDomain<T>;
    module: <T_1>(impl: RemeshModule<T_1>) => RemeshModule<T_1>;
    extern: <T_2 = void>(options: import("./remesh").RemeshExternOptions<T_2>) => RemeshExtern<T_2>;
    store: (options: import("./store").RemeshStoreOptions) => {
        name: string;
        getDomain: <T_3 extends Partial<import("./remesh").RemeshDomainOutput>>(Domain: RemeshDomain<T_3>) => T_3 & {
            command: (T_3["command"] extends {} ? { [key in keyof T_3["command"]]: (...args: Parameters<T_3["command"][key]>) => void; } : never) | undefined;
        };
        query: <T_4, U>(queryPayload: import("./remesh").RemeshQueryPayload<T_4, U>) => U;
        emitEvent: <T_5, U_1>(eventPayload: import("./remesh").RemeshEventPayload<T_5, U_1>) => void;
        emitCommand: <T_6>(input: import("./remesh").RemeshCommandPayload<T_6> | import("./remesh").RemeshCommand$Payload<T_6>) => void;
        destroy: () => void;
        subscribeQuery: <T_7, U_2>(queryPayload: import("./remesh").RemeshQueryPayload<T_7, U_2>, subscriber: (data: U_2) => unknown) => import("rxjs").Subscription;
        subscribeEvent: <T_8, U_3 = T_8>(Event: import("./remesh").RemeshEvent<T_8, U_3>, subscriber: (event: U_3) => unknown) => import("rxjs").Subscription;
        subscribeDomain: <T_9 extends Partial<import("./remesh").RemeshDomainOutput>>(Domain: RemeshDomain<T_9>) => import("rxjs").Subscription;
        getKey: <T_10, U_4>(stateItem: import("./remesh").RemeshStateItem<T_10, U_4> | import("./remesh").RemeshQueryPayload<T_10, U_4>) => string;
    };
};
