/// <reference types="react" />
export declare const Cells: import("../remesh").RemeshDomain<{
    query: {
        CellQuery: import("../remesh").RemeshQuery<string, {
            type: "text";
            isEditing: boolean;
            content: string;
            displayContent: string;
        } | {
            type: "formula";
            isEditing: boolean;
            content: string;
            displayContent: any;
        }>;
        ColumnKeyListQuery: import("../remesh").RemeshQuery<void, string[]>;
        RowKeyListQuery: import("../remesh").RemeshQuery<void, string[]>;
    };
    command: {
        selectCell: import("../remesh").RemeshCommand<string>;
        unselectCell: import("../remesh").RemeshCommand<string>;
        setCellContent: import("../remesh").RemeshCommand<{
            key: string;
            input: string;
        }>;
    };
}>;
export declare const CellsApp: () => JSX.Element;
