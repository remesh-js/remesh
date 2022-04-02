import { RemeshDomainContext } from '../index';
export declare type SwitchModuleOptions<T> = {
    name: string;
    default: T;
};
export declare type SwitchedEventData<T> = {
    previous: T;
    current: T;
};
export declare const SwitchModule: <T>(domain: RemeshDomainContext, options: SwitchModuleOptions<T>) => {
    query: {
        SwitchQuery: import("../remesh").RemeshQuery<void, T>;
    };
    command: {
        switchTo: import("../remesh").RemeshCommand<import("../remesh").Undefined2Void<T>>;
    };
    event: {
        SwitchedEvent: import("../remesh").RemeshEvent<SwitchedEventData<T>, SwitchedEventData<T>>;
    };
};
