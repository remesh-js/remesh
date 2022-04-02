import { RemeshDomain, RemeshCommand$Payload, RemeshCommandPayload, RemeshEventPayload } from './remesh';
import type { RemeshStoreOptions, RemeshDomainStorage, RemeshStateStorage, RemeshQueryStorage } from './store';
export declare type RemeshDomainStorageEventData<T, U> = {
    type: 'Domain::Created' | 'Domain::Destroyed' | 'Domain::Restored';
    storage: RemeshDomainStorage<T, U>;
};
export declare type RemeshStateStorageEventData<T, U> = {
    type: 'State::Created' | 'State::Updated' | 'State::Destroyed' | 'State::Restored';
    storage: RemeshStateStorage<T, U>;
};
export declare type RemeshQueryStorageEventData<T, U> = {
    type: 'Query::Created' | 'Query::Updated' | 'Query::Destroyed' | 'Query::Restored';
    storage: RemeshQueryStorage<T, U>;
};
export declare type RemeshEventEmittedEventData<T, U> = {
    type: 'Event::Emitted';
    payload: RemeshEventPayload<T, U>;
};
export declare type RemeshCommandReceivedEventData<T> = {
    type: 'Command::Received';
    payload: RemeshCommandPayload<T>;
};
export declare type RemeshCommand$ReceivedEventData<T> = {
    type: 'Command$::Received';
    payload: RemeshCommand$Payload<T>;
};
export declare const InspectorType: {
    readonly DomainCreated: "Domain::Created";
    readonly DomainDestroyed: "Domain::Destroyed";
    readonly DomainRestored: "Domain::Restored";
    readonly StateCreated: "State::Created";
    readonly StateUpdated: "State::Updated";
    readonly StateDestroyed: "State::Destroyed";
    readonly StateRestored: "State::Restored";
    readonly QueryCreated: "Query::Created";
    readonly QueryUpdated: "Query::Updated";
    readonly QueryDestroyed: "Query::Destroyed";
    readonly QueryRestored: "Query::Restored";
    readonly EventEmitted: "Event::Emitted";
    readonly CommandReceived: "Command::Received";
    readonly Command$Received: "Command$::Received";
};
export declare const RemeshInspectorDomain: RemeshDomain<{
    event: {
        RemeshDomainStorageEvent: import("./remesh").RemeshEvent<RemeshDomainStorageEventData<any, any>, RemeshDomainStorageEventData<any, any>>;
        RemeshStateStorageEvent: import("./remesh").RemeshEvent<RemeshStateStorageEventData<any, any>, RemeshStateStorageEventData<any, any>>;
        RemeshQueryStorageEvent: import("./remesh").RemeshEvent<RemeshQueryStorageEventData<any, any>, RemeshQueryStorageEventData<any, any>>;
        RemeshEventEmittedEvent: import("./remesh").RemeshEvent<RemeshEventEmittedEventData<any, any>, RemeshEventEmittedEventData<any, any>>;
        RemeshCommandReceivedEvent: import("./remesh").RemeshEvent<RemeshCommandReceivedEventData<any>, RemeshCommandReceivedEventData<any>>;
        RemeshCommand$ReceivedEvent: import("./remesh").RemeshEvent<RemeshCommand$ReceivedEventData<any>, RemeshCommand$ReceivedEventData<any>>;
    };
}, void>;
export declare type InspectInput = {
    inspectable: boolean;
    owner?: {
        Domain: {
            inspectable: boolean;
        };
    };
};
export declare const isInspectable: (input: InspectInput) => boolean;
export declare const createInspectorManager: (options: RemeshStoreOptions) => {
    destroyInspectors: () => void;
    inspectDomainStorage: <T, U>(type: "Domain::Created" | "Domain::Destroyed" | "Domain::Restored", domainStorage: RemeshDomainStorage<T, U>) => void;
    inspectStateStorage: <T_1, U_1>(type: "State::Created" | "State::Updated" | "State::Destroyed" | "State::Restored", stateStorage: RemeshStateStorage<T_1, U_1>) => void;
    inspectQueryStorage: <T_2, U_2>(type: "Query::Created" | "Query::Updated" | "Query::Destroyed" | "Query::Restored", queryStorage: RemeshQueryStorage<T_2, U_2>) => void;
    inspectEventEmitted: <T_3, U_3>(type: "Event::Emitted", eventPayload: RemeshEventPayload<T_3, U_3>) => void;
    inspectCommandReceived: <T_4>(type: "Command::Received", commandPayload: RemeshCommandPayload<T_4>) => void;
    inspectCommand$Received: <T_5>(type: "Command$::Received", command$Payload: RemeshCommand$Payload<T_5>) => void;
};
