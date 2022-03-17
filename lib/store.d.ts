import { Subscription } from 'rxjs';
import { RemeshCommand$Payload, RemeshCommandPayload, RemeshDomain, RemeshEvent, RemeshEventPayload, RemeshExternPayload, RemeshQueryPayload, RemeshStateItem } from './remesh';
export declare type RemeshStore = ReturnType<typeof RemeshStore>;
export declare type RemeshStoreOptions = {
    name: string;
    externs?: RemeshExternPayload<any>[];
};
export declare const RemeshStore: (options: RemeshStoreOptions) => {
    name: string;
    getDomain: <T extends Partial<import("./remesh").RemeshDomainOutput>>(Domain: RemeshDomain<T>) => T & {
        command: (T["command"] extends {} ? { [key in keyof T["command"]]: (...args: Parameters<T["command"][key]>) => void; } : never) | undefined;
    };
    query: <T_1, U>(queryPayload: RemeshQueryPayload<T_1, U>) => U;
    emitEvent: <T_2, U_1>(eventPayload: RemeshEventPayload<T_2, U_1>) => void;
    emitCommand: <T_3>(input: RemeshCommandPayload<T_3> | RemeshCommand$Payload<T_3>) => void;
    destroy: () => void;
    subscribeQuery: <T_4, U_2>(queryPayload: RemeshQueryPayload<T_4, U_2>, subscriber: (data: U_2) => unknown) => Subscription;
    subscribeEvent: <T_5, U_3 = T_5>(Event: RemeshEvent<T_5, U_3>, subscriber: (event: U_3) => unknown) => Subscription;
    subscribeDomain: <T_6 extends Partial<import("./remesh").RemeshDomainOutput>>(Domain: RemeshDomain<T_6>) => Subscription;
    getKey: <T_7, U_4>(stateItem: RemeshStateItem<T_7, U_4> | RemeshQueryPayload<T_7, U_4>) => string;
};
