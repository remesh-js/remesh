"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRemeshDomain = exports.useRemeshEmit = exports.useRemeshEvent = exports.useRemeshQuery = exports.RemeshRoot = exports.useRemeshStore = exports.useRemeshReactContext = exports.RemeshReactContext = void 0;
var react_1 = require("react");
var store_1 = require("./store");
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
    var taskContextRef = (0, react_1.useRef)(null);
    if (taskContextRef.current === null) {
        if (props.store) {
            taskContextRef.current = {
                remeshStore: props.store,
            };
        }
        else {
            taskContextRef.current = {
                remeshStore: (0, store_1.RemeshStore)(__assign({ name: 'RemeshStore' }, props.options)),
            };
        }
    }
    (0, react_1.useEffect)(function () {
        return function () {
            var _a;
            (_a = taskContextRef.current) === null || _a === void 0 ? void 0 : _a.remeshStore.destroy();
        };
    }, []);
    return (react_1.default.createElement(exports.RemeshReactContext.Provider, { value: taskContextRef.current }, props.children));
};
exports.RemeshRoot = RemeshRoot;
var useRemeshQuery = function (queryPayload) {
    var store = (0, exports.useRemeshStore)();
    var _a = __read((0, react_1.useState)(function () { return store.query(queryPayload); }), 2), state = _a[0], setState = _a[1];
    var subscriptionRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        return function () {
            var _a;
            (_a = subscriptionRef.current) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            subscriptionRef.current = null;
        };
    }, [store, store.getKey(queryPayload)]);
    (0, react_1.useEffect)(function () {
        if (subscriptionRef.current !== null) {
            return;
        }
        subscriptionRef.current = store.subscribeQuery(queryPayload, setState);
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
var useRemeshDomain = function (Domain) {
    var store = (0, exports.useRemeshStore)();
    var domain = store.getDomain(Domain);
    (0, react_1.useEffect)(function () {
        var subscription = store.subscribeDomain(Domain);
        return function () {
            subscription.unsubscribe();
        };
    }, [store, Domain]);
    return domain;
};
exports.useRemeshDomain = useRemeshDomain;
//# sourceMappingURL=react.js.map