import React, { ReactNode } from 'react';
import { RemeshQueryPayload, RemeshEvent, RemeshStore, RemeshStoreOptions, RemeshDomain } from './remesh';
export declare type RemeshReactContext = {
    remeshStore: RemeshStore;
};
export declare const RemeshReactContext: React.Context<RemeshReactContext | null>;
export declare const useRemeshReactContext: () => RemeshReactContext;
export declare const useRemeshStore: () => RemeshStore;
export declare type RemeshRootProps = {
    children: ReactNode;
    options?: RemeshStoreOptions;
    store?: undefined;
} | {
    children: ReactNode;
    store: RemeshStore;
};
export declare const RemeshRoot: (props: RemeshRootProps) => JSX.Element;
export declare const useRemeshQuery: <T, U>(queryPayload: RemeshQueryPayload<T, U>) => U;
export declare const useRemeshEvent: <T, U = T>(Event: RemeshEvent<T, U>, callback: (data: U) => unknown) => void;
export declare const useRemeshEmit: () => <T, U>(eventPayload: import("./remesh").RemeshEventPayload<T, U>) => void;
export declare const useRemeshDomain: <T extends Partial<import("./remesh").RemeshDomainOutput>>(Domain: RemeshDomain<T>) => T & {
    command: (T["command"] extends {} ? { [key in keyof T["command"]]: (...args: Parameters<T["command"][key]>) => void; } : never) | undefined;
};
