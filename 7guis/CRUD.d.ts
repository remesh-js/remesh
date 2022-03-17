/// <reference types="react" />
declare type Name = {
    name: string;
    surname: string;
};
declare type NameItem = {
    id: string;
} & Name;
export declare const CRUD: import("../remesh").RemeshDomain<{
    query: {
        FilteredListQuery: import("../remesh").RemeshQuery<void, NameItem[]>;
        SelectedQuery: import("../remesh").RemeshQuery<void, NameItem | null>;
        FilterPrefixQuery: import("../remesh").RemeshQuery<void, string>;
        CreatedQuery: import("../remesh").RemeshQuery<void, Name>;
        KeyListQuery: import("../remesh").RemeshQuery<void, string[]>;
        ItemQuery: import("../remesh").RemeshQuery<string, NameItem>;
        ItemListQuery: import("../remesh").RemeshQuery<void, NameItem[]>;
    };
    command: {
        updateFilterPrefix: import("../remesh").RemeshCommand<string>;
        selectItem: import("../remesh").RemeshCommand<string | null>;
        updateCreated: import("../remesh").RemeshCommand<Partial<Name>>;
        updateSelectedName: import("../remesh").RemeshCommand<Partial<Name>>;
        createNameItem: import("../remesh").RemeshCommand<void>;
        syncSelected: import("../remesh").RemeshCommand<void>;
        setList: import("../remesh").RemeshCommand<NameItem[]>;
        addItem: import("../remesh").RemeshCommand<NameItem>;
        removeItem: import("../remesh").RemeshCommand<string>;
        updateItem: import("../remesh").RemeshCommand<NameItem>;
    };
}>;
export declare const CRUDApp: () => JSX.Element;
export {};
