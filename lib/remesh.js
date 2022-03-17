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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Remesh = exports.RemeshStore = exports.RemeshModule = exports.RemeshDomain = exports.RemeshExtern = exports.RemeshCommand$ = exports.RemeshCommand = exports.RemeshQuery = exports.RemeshState = exports.defaultCompare = exports.RemeshDefaultState = exports.RemeshEvent = void 0;
var rxjs_1 = require("rxjs");
var shallowequal_1 = require("shallowequal");
var is_plain_object_1 = require("is-plain-object");
var eventUid = 0;
var RemeshEvent = function (options) {
    var eventId = eventUid++;
    var Event = (function (arg) {
        return {
            type: 'RemeshEventPayload',
            arg: arg,
            Event: Event,
        };
    });
    Event.type = 'RemeshEvent';
    Event.eventId = eventId;
    Event.eventName = options.name;
    Event.impl = options.impl;
    return Event;
};
exports.RemeshEvent = RemeshEvent;
var RemeshDefaultState = function (options) {
    return (0, exports.RemeshState)({
        name: options.name,
        impl: function () { return options.default; },
        compare: options.compare,
        cacheOptions: options.cacheOptions,
    });
};
exports.RemeshDefaultState = RemeshDefaultState;
var stateUid = 0;
var defaultCompare = function (prev, curr) {
    if ((0, is_plain_object_1.isPlainObject)(prev) && (0, is_plain_object_1.isPlainObject)(curr)) {
        return (0, shallowequal_1.default)(prev, curr);
    }
    return prev === curr;
};
exports.defaultCompare = defaultCompare;
var RemeshState = function (options) {
    var _a;
    var stateId = stateUid++;
    var cacheForNullary = null;
    var State = (function (arg) {
        if (arg === undefined && cacheForNullary) {
            return cacheForNullary;
        }
        var stateItem = {
            type: 'RemeshStateItem',
            arg: arg,
            State: State,
            new: function (newState) {
                return {
                    type: 'RemeshStateSetterPayload',
                    stateItem: stateItem,
                    newState: newState,
                };
            },
        };
        if (arg === undefined) {
            cacheForNullary = stateItem;
        }
        return stateItem;
    });
    State.type = 'RemeshState';
    State.stateId = stateId;
    State.stateName = options.name;
    State.impl = options.impl;
    State.compare = (_a = options.compare) !== null && _a !== void 0 ? _a : exports.defaultCompare;
    State.Query = (0, exports.RemeshQuery)({
        name: "Query(" + options.name + ")",
        impl: function (_a, arg) {
            var get = _a.get;
            return get(State(arg));
        },
    });
    return State;
};
exports.RemeshState = RemeshState;
var queryUid = 0;
var RemeshQuery = function (options) {
    var _a;
    var queryId = queryUid++;
    /**
     * optimize for nullary query
     */
    var cacheForNullary = null;
    var Query = (function (arg) {
        if (arg === undefined && cacheForNullary) {
            return cacheForNullary;
        }
        var payload = {
            type: 'RemeshQueryPayload',
            Query: Query,
            arg: arg,
        };
        if (arg === undefined) {
            cacheForNullary = payload;
        }
        return payload;
    });
    Query.type = 'RemeshQuery';
    Query.queryId = queryId;
    Query.queryName = options.name;
    Query.impl = options.impl;
    Query.compare = (_a = options.compare) !== null && _a !== void 0 ? _a : exports.defaultCompare;
    return Query;
};
exports.RemeshQuery = RemeshQuery;
var commandUid = 0;
var RemeshCommand = function (options) {
    var commandId = commandUid++;
    var Command = (function (arg) {
        return {
            type: 'RemeshCommandPayload',
            arg: arg,
            Command: Command,
        };
    });
    Command.type = 'RemeshCommand';
    Command.commandId = commandId;
    Command.commandName = options.name;
    Command.impl = options.impl;
    return Command;
};
exports.RemeshCommand = RemeshCommand;
var command$Uid = 0;
var RemeshCommand$ = function (options) {
    var command$Id = command$Uid++;
    var Command$ = (function (arg) {
        return {
            type: 'RemeshCommand$Payload',
            arg: arg,
            Command$: Command$,
        };
    });
    Command$.type = 'RemeshCommand$';
    Command$.command$Id = command$Id;
    Command$.command$Name = options.name;
    Command$.impl = options.impl;
    return Command$;
};
exports.RemeshCommand$ = RemeshCommand$;
var externUid = 0;
var RemeshExtern = function (options) {
    var Extern = (function (value) {
        return {
            type: 'RemeshExternPayload',
            Extern: Extern,
            value: value,
        };
    });
    Extern.externId = externUid++;
    Extern.externName = options.name;
    Extern.default = options.default;
    return Extern;
};
exports.RemeshExtern = RemeshExtern;
var domainUid = 0;
var RemeshDomain = function (options) {
    var Domain = {
        type: 'RemeshDomain',
        domainId: domainUid++,
        domainName: options.name,
        impl: options.impl,
    };
    return Domain;
};
exports.RemeshDomain = RemeshDomain;
var RemeshModule = function (impl) {
    return impl;
};
exports.RemeshModule = RemeshModule;
var DefaultDomain = (0, exports.RemeshDomain)({
    name: 'DefaultDomain',
    impl: function () {
        return {};
    },
});
var RemeshStore = function (options) {
    var dirtySet = new Set();
    var domainStorageMap = new Map();
    var externStorageMap = new Map();
    var pendingStorageSet = new Set();
    var getExternValue = function (Extern) {
        var e_1, _a;
        var _b;
        try {
            for (var _c = __values((_b = options.externs) !== null && _b !== void 0 ? _b : []), _d = _c.next(); !_d.done; _d = _c.next()) {
                var payload = _d.value;
                if (payload.Extern === Extern) {
                    return payload.value;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return Extern.default;
    };
    var getExternStorage = function (Extern) {
        var externStorage = externStorageMap.get(Extern);
        if (externStorage) {
            return externStorage;
        }
        var currentValue = getExternValue(Extern);
        var currentExternStorage = {
            type: 'RemeshExternStorage',
            Extern: Extern,
            currentValue: currentValue,
        };
        externStorageMap.set(Extern, currentExternStorage);
        return getExternStorage(Extern);
    };
    var getExternCurrentValue = function (Extern) {
        return getExternStorage(Extern).currentValue;
    };
    var storageKeyWeakMap = new WeakMap();
    var getStateStorageKey = function (stateItem) {
        var _a;
        var key = storageKeyWeakMap.get(stateItem);
        if (key) {
            return key;
        }
        var keyString = "State(" + stateItem.State.stateId + "):" + stateItem.State.stateName + "(" + ((_a = JSON.stringify(stateItem.arg)) !== null && _a !== void 0 ? _a : '') + ")";
        storageKeyWeakMap.set(stateItem, keyString);
        return keyString;
    };
    var getQueryStorageKey = function (queryPayload) {
        var _a;
        var key = storageKeyWeakMap.get(queryPayload);
        if (key) {
            return key;
        }
        var keyString = "Query(" + queryPayload.Query.queryId + "):" + queryPayload.Query.queryName + "(" + ((_a = JSON.stringify(queryPayload.arg)) !== null && _a !== void 0 ? _a : '') + ")";
        storageKeyWeakMap.set(queryPayload, keyString);
        return keyString;
    };
    var getKey = function (stateItem) {
        if (stateItem.type === 'RemeshStateItem') {
            return getStateStorageKey(stateItem);
        }
        else {
            return getQueryStorageKey(stateItem);
        }
    };
    var getStateStorage = function (stateItem) {
        var _a;
        var domainStorage = getDomainStorage((_a = stateItem.State.ownerDomain) !== null && _a !== void 0 ? _a : DefaultDomain);
        var key = getStateStorageKey(stateItem);
        var stateStorage = domainStorage.stateMap.get(key);
        if (stateStorage) {
            return stateStorage;
        }
        domainStorage.stateMap.set(key, {
            type: 'RemeshStateStorage',
            State: stateItem.State,
            currentArg: stateItem.arg,
            currentKey: key,
            currentState: stateItem.State.impl(stateItem.arg),
            downstreamSet: new Set(),
        });
        console.log('create', key);
        return getStateStorage(stateItem);
    };
    var getEventStorage = function (Event) {
        var _a;
        var domainStorage = getDomainStorage((_a = Event.ownerDomain) !== null && _a !== void 0 ? _a : DefaultDomain);
        var eventStorage = domainStorage.eventMap.get(Event);
        if (eventStorage) {
            return eventStorage;
        }
        var subject = new rxjs_1.Subject();
        var observable = new rxjs_1.Observable(function (subscriber) {
            var subscription = subject.subscribe(subscriber);
            currentEventStorage.refCount += 1;
            return function () {
                subscription.unsubscribe();
                currentEventStorage.refCount -= 1;
                pendingStorageSet.add(currentEventStorage);
                commit();
            };
        });
        var currentEventStorage = {
            type: 'RemeshEventStorage',
            Event: Event,
            subject: subject,
            observable: observable,
            refCount: 0,
        };
        domainStorage.eventMap.set(Event, currentEventStorage);
        return getEventStorage(Event);
    };
    var getQueryStorage = function (queryPayload) {
        var e_2, _a;
        var _b;
        var domainStorage = getDomainStorage((_b = queryPayload.Query.ownerDomain) !== null && _b !== void 0 ? _b : DefaultDomain);
        var key = getQueryStorageKey(queryPayload);
        var queryStorage = domainStorage.queryMap.get(key);
        if (queryStorage) {
            return queryStorage;
        }
        var subject = new rxjs_1.Subject();
        var observable = new rxjs_1.Observable(function (subscriber) {
            var subscription = subject.subscribe(subscriber);
            currentQueryStorage.refCount += 1;
            return function () {
                subscription.unsubscribe();
                currentQueryStorage.refCount -= 1;
                pendingStorageSet.add(currentQueryStorage);
                commit();
            };
        });
        var upstreamSet = new Set();
        var downstreamSet = new Set();
        var Query = queryPayload.Query;
        var queryContext = {
            get: function (input) {
                if (input.type === 'RemeshStateItem') {
                    var upstreamStateStorage = getStateStorage(input);
                    upstreamSet.add(upstreamStateStorage);
                    return remeshInjectedContext.get(input);
                }
                if (input.type === 'RemeshQueryPayload') {
                    var upstreamQueryStorage = getQueryStorage(input);
                    upstreamSet.add(upstreamQueryStorage);
                    return remeshInjectedContext.get(input);
                }
                return remeshInjectedContext.get(input);
            },
        };
        var currentValue = Query.impl(queryContext, queryPayload.arg);
        var currentQueryStorage = {
            type: 'RemeshQueryStorage',
            Query: queryPayload.Query,
            currentArg: queryPayload.arg,
            currentValue: currentValue,
            currentKey: key,
            upstreamSet: upstreamSet,
            downstreamSet: downstreamSet,
            subject: subject,
            observable: observable,
            refCount: 0,
        };
        try {
            for (var upstreamSet_1 = __values(upstreamSet), upstreamSet_1_1 = upstreamSet_1.next(); !upstreamSet_1_1.done; upstreamSet_1_1 = upstreamSet_1.next()) {
                var upstream = upstreamSet_1_1.value;
                upstream.downstreamSet.add(currentQueryStorage);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (upstreamSet_1_1 && !upstreamSet_1_1.done && (_a = upstreamSet_1.return)) _a.call(upstreamSet_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        domainStorage.queryMap.set(key, currentQueryStorage);
        return currentQueryStorage;
    };
    var getCommand$Storage = function (Command$) {
        var _a;
        var domainStorage = getDomainStorage((_a = Command$.Domain) !== null && _a !== void 0 ? _a : DefaultDomain);
        var command$Storage = domainStorage.command$Map.get(Command$);
        if (command$Storage) {
            return command$Storage;
        }
        var subject = new rxjs_1.Subject();
        var observable = subject.asObservable();
        var currentCommand$Storage = {
            type: 'RemeshCommand$Storage',
            Command$: Command$,
            subject: subject,
            observable: observable,
        };
        domainStorage.command$Map.set(Command$, currentCommand$Storage);
        return currentCommand$Storage;
    };
    var getDomainStorage = function (Domain) {
        var e_3, _a;
        var domainStorage = domainStorageMap.get(Domain);
        if (domainStorage) {
            return domainStorage;
        }
        var isDomainInited = false;
        var upstreamSet = new Set();
        var command$Set = new Set();
        var domainContext = {
            state: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.state(..) asynchronously");
                }
                if ('default' in options) {
                    var StaticState = (0, exports.RemeshDefaultState)(options);
                    StaticState.ownerDomain = Domain;
                    return StaticState;
                }
                var State = (0, exports.RemeshState)(options);
                State.ownerDomain = Domain;
                return State;
            },
            query: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.query(..) asynchronously");
                }
                var Query = (0, exports.RemeshQuery)(options);
                Query.ownerDomain = Domain;
                return Query;
            },
            event: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.event(..) asynchronously");
                }
                var Event = (0, exports.RemeshEvent)(options);
                Event.ownerDomain = Domain;
                return Event;
            },
            command: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.command(..) asynchronously");
                }
                var Command = (0, exports.RemeshCommand)(options);
                Command.Domain = Domain;
                return Command;
            },
            command$: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.command$(..) asynchronously");
                }
                var Command$ = (0, exports.RemeshCommand$)(options);
                Command$.Domain = Domain;
                command$Set.add(Command$);
                return Command$;
            },
            module: function (remeshModule) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.module(..) asynchronously");
                }
                var module = remeshModule(domainContext);
                return module;
            },
            getDomain: function (UpstreamDomain) {
                var upstreamDomainStorage = getDomainStorage(UpstreamDomain);
                upstreamSet.add(upstreamDomainStorage);
                return upstreamDomainStorage.domain;
            },
            getExtern: function (Extern) {
                return getExternCurrentValue(Extern);
            },
        };
        var domain = Domain.impl(domainContext);
        isDomainInited = true;
        var currentDomainStorage = {
            type: 'RemeshDomainStorage',
            Domain: Domain,
            domain: domain,
            command$Set: command$Set,
            upstreamSet: upstreamSet,
            downstreamSet: new Set(),
            upstreamSubscriptionSet: new Set(),
            domainSubscriptionSet: new Set(),
            stateMap: new Map(),
            queryMap: new Map(),
            eventMap: new Map(),
            command$Map: new Map(),
            refCount: 0,
            running: false,
        };
        domainStorageMap.set(Domain, currentDomainStorage);
        try {
            for (var upstreamSet_2 = __values(upstreamSet), upstreamSet_2_1 = upstreamSet_2.next(); !upstreamSet_2_1.done; upstreamSet_2_1 = upstreamSet_2.next()) {
                var upstreamDomainStorage = upstreamSet_2_1.value;
                upstreamDomainStorage.downstreamSet.add(currentDomainStorage);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (upstreamSet_2_1 && !upstreamSet_2_1.done && (_a = upstreamSet_2.return)) _a.call(upstreamSet_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return getDomainStorage(Domain);
    };
    var clearQueryStorage = function (queryStorage) {
        var e_4, _a;
        var _b;
        var domainStorage = getDomainStorage((_b = queryStorage.Query.ownerDomain) !== null && _b !== void 0 ? _b : DefaultDomain);
        queryStorage.subject.complete();
        domainStorage.queryMap.delete(queryStorage.currentKey);
        try {
            for (var _c = __values(queryStorage.upstreamSet), _d = _c.next(); !_d.done; _d = _c.next()) {
                var upstreamStorage = _d.value;
                upstreamStorage.downstreamSet.delete(queryStorage);
                if (upstreamStorage.type === 'RemeshQueryStorage') {
                    clearQueryStorageIfNeeded(upstreamStorage);
                }
                else if (upstreamStorage.type === 'RemeshStateStorage') {
                    clearStateStorageIfNeeded(upstreamStorage);
                }
                else {
                    throw new Error("Unknown upstream in clearQueryStorageIfNeeded(..): " + upstreamStorage);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    var clearQueryStorageIfNeeded = function (queryStorage) {
        if (queryStorage.refCount !== 0) {
            return;
        }
        if (queryStorage.downstreamSet.size !== 0) {
            return;
        }
        clearQueryStorage(queryStorage);
    };
    var clearStateStorage = function (stateStorage) {
        var _a;
        var domainStorage = getDomainStorage((_a = stateStorage.State.ownerDomain) !== null && _a !== void 0 ? _a : DefaultDomain);
        if (domainStorage.stateMap.has(stateStorage.currentKey)) {
            console.log('delete', stateStorage.currentKey);
        }
        domainStorage.stateMap.delete(stateStorage.currentKey);
    };
    var clearStateStorageIfNeeded = function (stateStorage) {
        if (stateStorage.downstreamSet.size !== 0) {
            return;
        }
        clearStateStorage(stateStorage);
    };
    var clearEventStorage = function (eventStorage) {
        var _a;
        var domainStorage = getDomainStorage((_a = eventStorage.Event.ownerDomain) !== null && _a !== void 0 ? _a : DefaultDomain);
        eventStorage.subject.complete();
        domainStorage.eventMap.delete(eventStorage.Event);
    };
    var clearEventStorageIfNeeded = function (eventStorage) {
        if (eventStorage.refCount !== 0) {
            return;
        }
        clearEventStorage(eventStorage);
    };
    var clearCommand$Storage = function (command$Storage) {
        var _a, _b;
        var domainStorage = getDomainStorage((_a = command$Storage.Command$.Domain) !== null && _a !== void 0 ? _a : DefaultDomain);
        command$Storage.subject.complete();
        (_b = command$Storage.subscription) === null || _b === void 0 ? void 0 : _b.unsubscribe();
        domainStorage.command$Map.delete(command$Storage.Command$);
    };
    var clearDomainStorage = function (domainStorage) {
        var e_5, _a, e_6, _b, e_7, _c, e_8, _d, e_9, _e;
        var upstreamList = __spreadArray([], __read(domainStorage.upstreamSet), false);
        clearSubscriptionSet(domainStorage.domainSubscriptionSet);
        clearSubscriptionSet(domainStorage.upstreamSubscriptionSet);
        try {
            for (var _f = __values(domainStorage.eventMap.values()), _g = _f.next(); !_g.done; _g = _f.next()) {
                var eventStorage = _g.value;
                clearEventStorage(eventStorage);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
            }
            finally { if (e_5) throw e_5.error; }
        }
        try {
            for (var _h = __values(domainStorage.queryMap.values()), _j = _h.next(); !_j.done; _j = _h.next()) {
                var queryStorage = _j.value;
                clearQueryStorage(queryStorage);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
            }
            finally { if (e_6) throw e_6.error; }
        }
        try {
            for (var _k = __values(domainStorage.stateMap.values()), _l = _k.next(); !_l.done; _l = _k.next()) {
                var stateStorage = _l.value;
                clearStateStorage(stateStorage);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
            }
            finally { if (e_7) throw e_7.error; }
        }
        try {
            for (var _m = __values(domainStorage.command$Map.values()), _o = _m.next(); !_o.done; _o = _m.next()) {
                var command$Storage = _o.value;
                clearCommand$Storage(command$Storage);
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
            }
            finally { if (e_8) throw e_8.error; }
        }
        domainStorage.upstreamSubscriptionSet.clear();
        domainStorage.domainSubscriptionSet.clear();
        domainStorage.downstreamSet.clear();
        domainStorage.upstreamSet.clear();
        domainStorage.stateMap.clear();
        domainStorage.queryMap.clear();
        domainStorage.eventMap.clear();
        domainStorageMap.delete(domainStorage.Domain);
        try {
            for (var upstreamList_1 = __values(upstreamList), upstreamList_1_1 = upstreamList_1.next(); !upstreamList_1_1.done; upstreamList_1_1 = upstreamList_1.next()) {
                var upstreamDomainStorage = upstreamList_1_1.value;
                upstreamDomainStorage.downstreamSet.delete(domainStorage);
                clearDomainStorageIfNeeded(upstreamDomainStorage);
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (upstreamList_1_1 && !upstreamList_1_1.done && (_e = upstreamList_1.return)) _e.call(upstreamList_1);
            }
            finally { if (e_9) throw e_9.error; }
        }
    };
    var clearDomainStorageIfNeeded = function (domainStorage) {
        if (domainStorage.refCount !== 0) {
            return;
        }
        if (domainStorage.downstreamSet.size !== 0) {
            return;
        }
        if (domainStorage.domainSubscriptionSet.size !== 0) {
            return;
        }
        clearDomainStorage(domainStorage);
    };
    var getCurrentState = function (stateItem) {
        var stateStorage = getStateStorage(stateItem);
        return stateStorage.currentState;
    };
    var getCurrentQueryValue = function (queryPayload) {
        var queryStorage = getQueryStorage(queryPayload);
        return queryStorage.currentValue;
    };
    var remeshInjectedContext = {
        get: function (input) {
            if (input.type === 'RemeshStateItem') {
                return getCurrentState(input);
            }
            if (input.type === 'RemeshQueryPayload') {
                return getCurrentQueryValue(input);
            }
            throw new Error("Unexpected input in ctx.get(..): " + input);
        },
        fromEvent: function (Event) {
            var eventStorage = getEventStorage(Event);
            return eventStorage.observable;
        },
        fromQuery: function (queryPayload) {
            var queryStorage = getQueryStorage(queryPayload);
            return queryStorage.observable;
        },
    };
    var updateQueryStorage = function (queryStorage) {
        var e_10, _a, e_11, _b;
        var Query = queryStorage.Query;
        try {
            for (var _c = __values(queryStorage.upstreamSet), _d = _c.next(); !_d.done; _d = _c.next()) {
                var upstream = _d.value;
                upstream.downstreamSet.delete(queryStorage);
                if (upstream.downstreamSet.size === 0) {
                    pendingStorageSet.add(upstream);
                }
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_10) throw e_10.error; }
        }
        queryStorage.upstreamSet.clear();
        var queryContext = {
            get: function (input) {
                if (input.type === 'RemeshStateItem') {
                    var stateItem = input;
                    var upstreamStateStorage = getStateStorage(stateItem);
                    queryStorage.upstreamSet.add(upstreamStateStorage);
                    upstreamStateStorage.downstreamSet.add(queryStorage);
                    return remeshInjectedContext.get(stateItem);
                }
                if (input.type === 'RemeshQueryPayload') {
                    var queryPayload = input;
                    var upstreamQueryStorage = getQueryStorage(queryPayload);
                    queryStorage.upstreamSet.add(upstreamQueryStorage);
                    upstreamQueryStorage.downstreamSet.add(queryStorage);
                    return remeshInjectedContext.get(queryPayload);
                }
                return remeshInjectedContext.get(input);
            },
        };
        var newValue = Query.impl(queryContext, queryStorage.currentArg);
        var isEqual = Query.compare(queryStorage.currentValue, newValue);
        if (isEqual) {
            return;
        }
        queryStorage.currentValue = newValue;
        dirtySet.add(queryStorage);
        try {
            /**
             * updateQueryStorage may update upstream.downstreamSet
             * so it should be converted to an array for avoiding infinite loop
             */
            for (var _e = __values(__spreadArray([], __read(queryStorage.downstreamSet), false)), _f = _e.next(); !_f.done; _f = _e.next()) {
                var downstream = _f.value;
                updateQueryStorage(downstream);
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_11) throw e_11.error; }
        }
    };
    var clearPendingStorageSetIfNeeded = function () {
        var e_12, _a;
        if (pendingStorageSet.size === 0) {
            return;
        }
        var storageList = __spreadArray([], __read(pendingStorageSet), false);
        pendingStorageSet.clear();
        try {
            for (var storageList_1 = __values(storageList), storageList_1_1 = storageList_1.next(); !storageList_1_1.done; storageList_1_1 = storageList_1.next()) {
                var storage = storageList_1_1.value;
                if (storage.type === 'RemeshDomainStorage') {
                    clearDomainStorageIfNeeded(storage);
                }
                else if (storage.type === 'RemeshEventStorage') {
                    clearEventStorageIfNeeded(storage);
                }
                else if (storage.type === 'RemeshQueryStorage') {
                    clearQueryStorageIfNeeded(storage);
                }
                else if (storage.type === 'RemeshStateStorage') {
                    clearStateStorageIfNeeded(storage);
                }
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (storageList_1_1 && !storageList_1_1.done && (_a = storageList_1.return)) _a.call(storageList_1);
            }
            finally { if (e_12) throw e_12.error; }
        }
        clearPendingStorageSetIfNeeded();
    };
    var clearIfNeeded = function () {
        clearDirtySetIfNeeded();
        clearPendingStorageSetIfNeeded();
    };
    var clearDirtySetIfNeeded = function () {
        var e_13, _a;
        if (dirtySet.size === 0) {
            return;
        }
        var queryStorageList = __spreadArray([], __read(dirtySet), false);
        dirtySet.clear();
        try {
            for (var queryStorageList_1 = __values(queryStorageList), queryStorageList_1_1 = queryStorageList_1.next(); !queryStorageList_1_1.done; queryStorageList_1_1 = queryStorageList_1.next()) {
                var queryStorage = queryStorageList_1_1.value;
                if (!dirtySet.has(queryStorage)) {
                    queryStorage.subject.next(queryStorage.currentValue);
                }
            }
        }
        catch (e_13_1) { e_13 = { error: e_13_1 }; }
        finally {
            try {
                if (queryStorageList_1_1 && !queryStorageList_1_1.done && (_a = queryStorageList_1.return)) _a.call(queryStorageList_1);
            }
            finally { if (e_13) throw e_13.error; }
        }
        /**
         * recursively consuming dirty set unit it become empty.
         */
        clearDirtySetIfNeeded();
    };
    var commit = function () {
        clearIfNeeded();
    };
    var handleStatePayload = function (statePayload) {
        var e_14, _a;
        var stateStorage = getStateStorage(statePayload.stateItem);
        var isEqual = statePayload.stateItem.State.compare(stateStorage.currentState, statePayload.newState);
        if (isEqual) {
            return;
        }
        stateStorage.currentArg = statePayload.stateItem.arg;
        stateStorage.currentKey = getStateStorageKey(statePayload.stateItem);
        stateStorage.currentState = statePayload.newState;
        try {
            /**
             * updateQueryStorage may update upstream.downstreamSet
             * so it should be converted to an array for avoiding infinite loop
             */
            for (var _b = __values(__spreadArray([], __read(stateStorage.downstreamSet), false)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var downstream = _c.value;
                updateQueryStorage(downstream);
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_14) throw e_14.error; }
        }
        commit();
    };
    var handleEventPayload = function (eventPayload) {
        var Event = eventPayload.Event, arg = eventPayload.arg;
        var eventStorage = getEventStorage(Event);
        if (Event.impl) {
            var eventContext = {
                get: remeshInjectedContext.get,
            };
            var data = Event.impl(eventContext, arg);
            eventStorage.subject.next(data);
        }
        else {
            eventStorage.subject.next(arg);
        }
    };
    var handleCommandPayload = function (commandPayload) {
        var Command = commandPayload.Command, arg = commandPayload.arg;
        var commandContext = {
            get: remeshInjectedContext.get,
        };
        var commandOutput = Command.impl(commandContext, arg);
        handleCommandOutput(commandOutput);
    };
    var handleSubscription = function (subscriptionSet, subscription) {
        subscriptionSet.add(subscription);
        subscription.add(function () {
            subscriptionSet.delete(subscription);
        });
    };
    var initCommand$IfNeeded = function (Command$) {
        var command$Storage = getCommand$Storage(Command$);
        if (command$Storage.subscription) {
            return;
        }
        var command$Context = {
            get: remeshInjectedContext.get,
            fromEvent: remeshInjectedContext.fromEvent,
            fromQuery: remeshInjectedContext.fromQuery,
        };
        var subscription = Command$.impl(command$Context, command$Storage.observable).subscribe(handleCommandOutput);
        command$Storage.subscription = subscription;
    };
    var handleCommandOutput = function (commandOutput) {
        var e_15, _a;
        if (Array.isArray(commandOutput)) {
            try {
                for (var commandOutput_1 = __values(commandOutput), commandOutput_1_1 = commandOutput_1.next(); !commandOutput_1_1.done; commandOutput_1_1 = commandOutput_1.next()) {
                    var item = commandOutput_1_1.value;
                    handleCommandOutput(item);
                }
            }
            catch (e_15_1) { e_15 = { error: e_15_1 }; }
            finally {
                try {
                    if (commandOutput_1_1 && !commandOutput_1_1.done && (_a = commandOutput_1.return)) _a.call(commandOutput_1);
                }
                finally { if (e_15) throw e_15.error; }
            }
            return;
        }
        if (commandOutput.type === 'RemeshCommandPayload') {
            handleCommandPayload(commandOutput);
            return;
        }
        else if (commandOutput.type === 'RemeshEventPayload') {
            handleEventPayload(commandOutput);
            return;
        }
        else if (commandOutput.type === 'RemeshStateSetterPayload') {
            handleStatePayload(commandOutput);
            return;
        }
        else if (commandOutput.type === 'RemeshCommand$Payload') {
            handleCommand$Payload(commandOutput);
            return;
        }
        throw new Error("Unknown command output of " + commandOutput);
    };
    var handleCommand$Payload = function (command$Payload) {
        var Command$ = command$Payload.Command$, arg = command$Payload.arg;
        var command$Storage = getCommand$Storage(Command$);
        initCommand$IfNeeded(Command$);
        command$Storage.subject.next(arg);
    };
    var addDomainSubscription = function (domainStorage, domainSubscription) {
        handleSubscription(domainStorage.domainSubscriptionSet, domainSubscription);
        domainSubscription.add(function () {
            pendingStorageSet.add(domainStorage);
            commit();
        });
    };
    var subscribeQuery = function (queryPayload, subscriber) {
        var queryStorage = getQueryStorage(queryPayload);
        var subscription = queryStorage.observable.subscribe(subscriber);
        return subscription;
    };
    var subscribeEvent = function (Event, subscriber) {
        var eventStorage = getEventStorage(Event);
        var subscription = eventStorage.observable.subscribe(subscriber);
        return subscription;
    };
    var getCommand = function (Domain) {
        var domainStorage = getDomainStorage(Domain);
        var domain = domainStorage.domain;
        if (domain.command) {
            var command = {};
            var _loop_1 = function (key) {
                var Command = domain.command[key];
                // @ts-ignore
                command[key] = function (arg) { return emitCommand(Command(arg)); };
            };
            for (var key in domain.command) {
                _loop_1(key);
            }
            return command;
        }
    };
    var domainOutputWeakMap = new WeakMap();
    var getDomain = function (Domain) {
        if (domainOutputWeakMap.has(Domain)) {
            return domainOutputWeakMap.get(Domain);
        }
        var domainStorage = getDomainStorage(Domain);
        var domain = domainStorage.domain;
        var command = getCommand(Domain);
        var domainOutput = __assign(__assign({}, domain), { command: command });
        domainOutputWeakMap.set(Domain, domainOutput);
        return domainOutput;
    };
    var initCommand$Set = function (command$Set) {
        var e_16, _a;
        try {
            for (var command$Set_1 = __values(command$Set), command$Set_1_1 = command$Set_1.next(); !command$Set_1_1.done; command$Set_1_1 = command$Set_1.next()) {
                var Command$ = command$Set_1_1.value;
                initCommand$IfNeeded(Command$);
            }
        }
        catch (e_16_1) { e_16 = { error: e_16_1 }; }
        finally {
            try {
                if (command$Set_1_1 && !command$Set_1_1.done && (_a = command$Set_1.return)) _a.call(command$Set_1);
            }
            finally { if (e_16) throw e_16.error; }
        }
        command$Set.clear();
    };
    var runDomainStorageIfNeeded = function (domainStorage) {
        var e_17, _a;
        if (domainStorage.running) {
            return;
        }
        domainStorage.running = true;
        try {
            for (var _b = __values(domainStorage.upstreamSet), _c = _b.next(); !_c.done; _c = _b.next()) {
                var upstreamDomainStorage = _c.value;
                var upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.Domain);
                handleSubscription(domainStorage.upstreamSubscriptionSet, upstreamDomainSubscription);
            }
        }
        catch (e_17_1) { e_17 = { error: e_17_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_17) throw e_17.error; }
        }
        initCommand$Set(domainStorage.command$Set);
    };
    var subscribeDomain = function (Domain) {
        var domainStorage = getDomainStorage(Domain);
        var domainSubscription = new rxjs_1.Subscription();
        addDomainSubscription(domainStorage, domainSubscription);
        runDomainStorageIfNeeded(domainStorage);
        return domainSubscription;
    };
    var destroy = function () {
        var e_18, _a;
        try {
            for (var _b = __values(domainStorageMap.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var domainStorage = _c.value;
                clearDomainStorage(domainStorage);
            }
        }
        catch (e_18_1) { e_18 = { error: e_18_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_18) throw e_18.error; }
        }
        domainStorageMap.clear();
        dirtySet.clear();
    };
    var emitEvent = function (eventPayload) {
        handleEventPayload(eventPayload);
    };
    var emitCommand = function (input) {
        if (input.type === 'RemeshCommandPayload') {
            handleCommandPayload(input);
        }
        else if (input.type === 'RemeshCommand$Payload') {
            handleCommand$Payload(input);
        }
    };
    return {
        name: options.name,
        getDomain: getDomain,
        query: getCurrentQueryValue,
        emitEvent: emitEvent,
        emitCommand: emitCommand,
        destroy: destroy,
        subscribeQuery: subscribeQuery,
        subscribeEvent: subscribeEvent,
        subscribeDomain: subscribeDomain,
        getKey: getKey
    };
};
exports.RemeshStore = RemeshStore;
exports.Remesh = {
    domain: exports.RemeshDomain,
    module: exports.RemeshModule,
    extern: exports.RemeshExtern,
    store: exports.RemeshStore,
};
var clearSubscriptionSet = function (subscriptionSet) {
    var e_19, _a;
    try {
        for (var subscriptionSet_1 = __values(subscriptionSet), subscriptionSet_1_1 = subscriptionSet_1.next(); !subscriptionSet_1_1.done; subscriptionSet_1_1 = subscriptionSet_1.next()) {
            var subscription = subscriptionSet_1_1.value;
            subscription.unsubscribe();
        }
    }
    catch (e_19_1) { e_19 = { error: e_19_1 }; }
    finally {
        try {
            if (subscriptionSet_1_1 && !subscriptionSet_1_1.done && (_a = subscriptionSet_1.return)) _a.call(subscriptionSet_1);
        }
        finally { if (e_19) throw e_19.error; }
    }
};
//# sourceMappingURL=remesh.js.map