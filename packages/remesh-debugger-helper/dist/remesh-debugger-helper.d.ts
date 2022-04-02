export declare const formatTime: (time: Date) => string;
export declare const formatNow: () => string;
export declare type RemeshDebugSource = 'state' | 'query' | 'domain' | 'event' | 'command' | 'command$';
export declare type RemeshDebugOptions = {
    include?: RemeshDebugSource[];
    exclude?: RemeshDebugSource[];
};
export declare const RemeshDebuggerHelper: (options?: RemeshDebugOptions | undefined) => {
    onActive: (source: RemeshDebugSource, fn: () => unknown) => void;
};
