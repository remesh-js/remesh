"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRemeshDomain = exports.useRemeshEmit = exports.useRemeshEvent = exports.useRemeshQuery = exports.RemeshRoot = exports.useRemeshStore = exports.useRemeshReactContext = exports.RemeshReactContext = void 0;
var tslib_1 = require("tslib");
var react_1 = tslib_1.__importStar(require("react"));
var shim_1 = require("use-sync-external-store/shim");
exports.RemeshReactContext = (0, react_1.createContext)(null);
var useRemeshReactContext = function () {
    var context = (0, react_1.useContext)(exports.RemeshReactContext);
    if (context === null) {
        throw new Error("You may forgot to add <RemeshRoot />");
    }
    return context;
};
exports.useRemeshReactContext = useRemeshReactContext;
var useRemeshStore = function () {
    var context = (0, exports.useRemeshReactContext)();
    return context.remeshStore;
};
exports.useRemeshStore = useRemeshStore;
var RemeshRoot = function (props) {
    var contextValue = (0, react_1.useMemo)(function () {
        return {
            remeshStore: props.store,
        };
    }, [props.store]);
    return react_1.default.createElement(exports.RemeshReactContext.Provider, { value: contextValue }, props.children);
};
exports.RemeshRoot = RemeshRoot;
var useRemeshQuery = function (queryPayload) {
    var store = (0, exports.useRemeshStore)();
    var triggerRef = (0, react_1.useRef)(null);
    var subscribe = (0, react_1.useCallback)(function (triggerUpdate) {
        triggerRef.current = triggerUpdate;
        return function () {
            triggerRef.current = null;
        };
    }, []);
    var getSnapshot = (0, react_1.useCallback)(function () {
        var snapshot = store.query(queryPayload);
        return snapshot;
    }, [store, queryPayload]);
    var state = (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
    var subscriptionRef = (0, react_1.useRef)(null);
    var queryKey = store.getKey(queryPayload);
    (0, react_1.useEffect)(function () {
        return function () {
            var _a;
            (_a = subscriptionRef.current) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [store, queryKey]);
    (0, react_1.useEffect)(function () {
        if (subscriptionRef.current !== null) {
            return;
        }
        subscriptionRef.current = store.subscribeQuery(queryPayload, function () {
            var _a;
            (_a = triggerRef.current) === null || _a === void 0 ? void 0 : _a.call(triggerRef);
        });
    }, [store, queryPayload]);
    return state;
};
exports.useRemeshQuery = useRemeshQuery;
var useRemeshEvent = function (Event, callback) {
    var store = (0, exports.useRemeshStore)();
    var callbackRef = (0, react_1.useRef)(callback);
    (0, react_1.useEffect)(function () {
        callbackRef.current = callback;
    });
    (0, react_1.useEffect)(function () {
        var subscription = store.subscribeEvent(Event, function (data) {
            callbackRef.current(data);
        });
        return function () {
            subscription.unsubscribe();
        };
    }, [Event, store]);
};
exports.useRemeshEvent = useRemeshEvent;
var useRemeshEmit = function () {
    var store = (0, exports.useRemeshStore)();
    return store.emitEvent;
};
exports.useRemeshEmit = useRemeshEmit;
var useRemeshDomain = function (domainPayload) {
    var store = (0, exports.useRemeshStore)();
    var domain = store.getDomain(domainPayload);
    (0, react_1.useEffect)(function () {
        var subscription = store.subscribeDomain(domainPayload);
        return function () {
            subscription.unsubscribe();
        };
    }, [store, domainPayload]);
    return domain;
};
exports.useRemeshDomain = useRemeshDomain;
//# sourceMappingURL=remesh-react.js.map