import React, { ReactNode } from 'react';
import { RemeshQueryPayload, RemeshEvent, RemeshDomainPayload, RemeshStore } from 'remesh';
export declare type RemeshReactContext = {
    remeshStore: RemeshStore;
};
export declare const RemeshReactContext: React.Context<RemeshReactContext | null>;
export declare const useRemeshReactContext: () => RemeshReactContext;
export declare const useRemeshStore: () => RemeshStore;
export declare type RemeshRootProps = {
    children: ReactNode;
    store: RemeshStore;
};
export declare const RemeshRoot: (props: RemeshRootProps) => JSX.Element;
export declare const useRemeshQuery: <T, U>(queryPayload: RemeshQueryPayload<T, U>) => U;
export declare const useRemeshEvent: <T, U = T>(Event: RemeshEvent<T, U>, callback: (data: U) => unknown) => void;
export declare const useRemeshEmit: () => <T_2, U_1>(eventPayload: import("remesh").RemeshEventPayload<T_2, U_1>) => void;
export declare const useRemeshDomain: <T extends Partial<import("remesh").RemeshDomainOutput>, Arg>(domainPayload: RemeshDomainPayload<T, Arg>) => import("remesh").BindingDomainOutput<T>;
