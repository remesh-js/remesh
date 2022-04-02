import { RemeshDomainContext } from '../index';
export declare type ListModuleOptions<T> = {
    name: string;
    key: (item: T) => string;
};
export declare type ListChangedEventData<T> = {
    previous: T[];
    current: T[];
};
export declare type ItemAddedEventData<T> = {
    item: T;
};
export declare type FailedToAddItemEventData = {
    reason: string;
};
export declare type ItemUpdatedEventData<T> = {
    previous: T;
    current: T;
};
export declare type FailedToUpdateItemEventData<T> = {
    item: T;
    reason: string;
};
export declare type ItemDeletedEventData<T> = {
    item: T;
};
export declare const ListModule: <T>(domain: RemeshDomainContext, options: ListModuleOptions<T>) => {
    command: {
        setList: import("../remesh").RemeshCommand<T[]>;
        addItem: import("../remesh").RemeshCommand<import("../remesh").Undefined2Void<T>>;
        deleteItem: import("../remesh").RemeshCommand<string>;
        updateItem: import("../remesh").RemeshCommand<import("../remesh").Undefined2Void<T>>;
    };
    query: {
        KeyListQuery: import("../remesh").RemeshQuery<void, string[]>;
        ItemQuery: import("../remesh").RemeshQuery<string, T>;
        ItemListQuery: import("../remesh").RemeshQuery<void, T[]>;
    };
    event: {
        ListChangedEvent: import("../remesh").RemeshEvent<ListChangedEventData<T>, ListChangedEventData<T>>;
        ItemAddedEvent: import("../remesh").RemeshEvent<ItemAddedEventData<T>, ItemAddedEventData<T>>;
        FailedToAddItemEvent: import("../remesh").RemeshEvent<FailedToAddItemEventData, FailedToAddItemEventData>;
        ItemUpdatedEvent: import("../remesh").RemeshEvent<ItemUpdatedEventData<T>, ItemUpdatedEventData<T>>;
        FailedToUpdateItemEvent: import("../remesh").RemeshEvent<FailedToUpdateItemEventData<T>, FailedToUpdateItemEventData<T>>;
        ItemDeletedEvent: import("../remesh").RemeshEvent<ItemDeletedEventData<T>, ItemDeletedEventData<T>>;
    };
};
