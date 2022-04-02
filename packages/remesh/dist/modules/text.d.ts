import { RemeshDomainContext } from '../index';
export declare type TextModuleOptions = {
    name: string;
    default?: string;
};
export declare type TextChangedEventData = {
    previous: string;
    current: string;
};
export declare type TextClearedEventData = {
    previous: string;
};
export declare const TextModule: (domain: RemeshDomainContext, options: TextModuleOptions) => {
    query: {
        TextQuery: import("../remesh").RemeshQuery<void, string>;
    };
    command: {
        setText: import("../remesh").RemeshCommand<string>;
        clearText: import("../remesh").RemeshCommand<void>;
    };
    event: {
        TextChangedEvent: import("../remesh").RemeshEvent<TextChangedEventData, TextChangedEventData>;
        TextClearedEvent: import("../remesh").RemeshEvent<TextClearedEventData, TextClearedEventData>;
    };
};
