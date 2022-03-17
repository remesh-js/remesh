export declare type ListModuleOptions<T> = {
    name: string;
    getKey: (item: T) => string;
    createItem: (key: string) => T;
};
export declare const ListModule: <T>(options: ListModuleOptions<T>) => import("../remesh").RemeshModule<{
    command: {
        setList: import("../remesh").RemeshCommand<T[]>;
        addItem: import("../remesh").RemeshCommand<T>;
        removeItem: import("../remesh").RemeshCommand<string>;
        updateItem: import("../remesh").RemeshCommand<T>;
    };
    query: {
        KeyListQuery: import("../remesh").RemeshQuery<void, string[]>;
        ItemQuery: import("../remesh").RemeshQuery<string, T>;
        ItemListQuery: import("../remesh").RemeshQuery<void, T[]>;
    };
}>;
