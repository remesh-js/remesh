import { RemeshStoreInspector } from 'remesh';
import { RemeshDebugOptions } from 'remesh-debugger-helper';
export declare type RemeshLoggerOptions = RemeshDebugOptions & {
    collapsed?: boolean;
};
export declare const RemeshLogger: (options?: RemeshLoggerOptions | undefined) => RemeshStoreInspector;
