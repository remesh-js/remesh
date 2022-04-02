"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemeshStore = exports.StateValuePlaceholder = void 0;
var tslib_1 = require("tslib");
var rxjs_1 = require("rxjs");
var remesh_1 = require("./remesh");
var inspector_1 = require("./inspector");
exports.StateValuePlaceholder = Symbol('StateValuePlaceholder');
var RemeshStore = function (options) {
    var inspectorManager = (0, inspector_1.createInspectorManager)(options);
    var dirtySet = new Set();
    var domainStorageMap = new Map();
    var pendingStorageSet = new Set();
    var externStorageWeakMap = new WeakMap();
    var getExternValue = function (Extern) {
        var e_1, _a;
        var _b;
        try {
            for (var _c = tslib_1.__values((_b = options.externs) !== null && _b !== void 0 ? _b : []), _d = _c.next(); !_d.done; _d = _c.next()) {
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
        var externStorage = externStorageWeakMap.get(Extern);
        if (externStorage) {
            return externStorage;
        }
        var currentValue = getExternValue(Extern);
        var currentExternStorage = {
            type: 'RemeshExternStorage',
            Extern: Extern,
            currentValue: currentValue,
        };
        externStorageWeakMap.set(Extern, currentExternStorage);
        return currentExternStorage;
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
        var stateName = stateItem.State.stateName;
        var argString = (_a = JSON.stringify(stateItem.arg)) !== null && _a !== void 0 ? _a : '';
        var keyString = "State/".concat(stateItem.State.stateId, "/").concat(stateName, ":").concat(argString);
        storageKeyWeakMap.set(stateItem, keyString);
        return keyString;
    };
    var getQueryStorageKey = function (queryPayload) {
        var _a;
        var key = storageKeyWeakMap.get(queryPayload);
        if (key) {
            return key;
        }
        var queryName = queryPayload.Query.queryName;
        var argString = (_a = JSON.stringify(queryPayload.arg)) !== null && _a !== void 0 ? _a : '';
        var keyString = "Query/".concat(queryPayload.Query.queryId, "/").concat(queryName, ":").concat(argString);
        storageKeyWeakMap.set(queryPayload, keyString);
        return keyString;
    };
    var getDomainStorageKey = function (domainPayload) {
        var _a;
        var key = storageKeyWeakMap.get(domainPayload);
        if (key) {
            return key;
        }
        var domainName = domainPayload.Domain.domainName;
        var argString = (_a = JSON.stringify(domainPayload.arg)) !== null && _a !== void 0 ? _a : '';
        var keyString = "Domain/".concat(domainPayload.Domain.domainId, "/").concat(domainName, ":").concat(argString);
        storageKeyWeakMap.set(domainPayload, keyString);
        return keyString;
    };
    var getStorageKey = function (input) {
        if (input.type === 'RemeshStateItem') {
            return getStateStorageKey(input);
        }
        else if (input.type === 'RemeshQueryPayload') {
            return getQueryStorageKey(input);
        }
        return getDomainStorageKey(input);
    };
    var getStateFromStorage = function (storage) {
        if (storage.currentState === exports.StateValuePlaceholder) {
            throw new Error('Unexpected reading defer-state before assigning a value for it');
        }
        return storage.currentState;
    };
    var stateStorageWeakMap = new WeakMap();
    var createStateStorage = function (stateItem) {
        var domainStorage = getDomainStorage(stateItem.State.owner);
        var key = getStateStorageKey(stateItem);
        var currentState = stateItem.State.defer ? exports.StateValuePlaceholder : stateItem.State.impl(stateItem.arg);
        var newStateStorage = {
            type: 'RemeshStateStorage',
            State: stateItem.State,
            arg: stateItem.arg,
            key: key,
            currentState: currentState,
            downstreamSet: new Set(),
        };
        domainStorage.stateMap.set(key, newStateStorage);
        stateStorageWeakMap.set(stateItem, newStateStorage);
        inspectorManager.inspectStateStorage(inspector_1.InspectorType.StateCreated, newStateStorage);
        return newStateStorage;
    };
    var getStateStorage = function (stateItem) {
        var domainStorage = getDomainStorage(stateItem.State.owner);
        var key = getStateStorageKey(stateItem);
        var stateStorage = domainStorage.stateMap.get(key);
        if (stateStorage) {
            return stateStorage;
        }
        var cachedStorage = stateStorageWeakMap.get(stateItem);
        if (cachedStorage) {
            domainStorage.stateMap.set(key, cachedStorage);
            inspectorManager.inspectStateStorage(inspector_1.InspectorType.StateRestored, cachedStorage);
            return cachedStorage;
        }
        return createStateStorage(stateItem);
    };
    var eventStorageWeakMap = new WeakMap();
    var createEventStorage = function (Event) {
        var domainStorage = getDomainStorage(Event.owner);
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
        var cachedStorage = eventStorageWeakMap.get(Event);
        var currentEventStorage = Object.assign(cachedStorage !== null && cachedStorage !== void 0 ? cachedStorage : {}, {
            type: 'RemeshEventStorage',
            Event: Event,
            subject: subject,
            observable: observable,
            refCount: 0,
        });
        domainStorage.eventMap.set(Event, currentEventStorage);
        eventStorageWeakMap.set(Event, currentEventStorage);
        return currentEventStorage;
    };
    var getEventStorage = function (Event) {
        var domainStorage = getDomainStorage(Event.owner);
        var eventStorage = domainStorage.eventMap.get(Event);
        if (eventStorage) {
            return eventStorage;
        }
        return createEventStorage(Event);
    };
    var queryStorageWeakMap = new WeakMap();
    var createQuery$ = function (get) {
        var subject = new rxjs_1.Subject();
        var observable = new rxjs_1.Observable(function (subscriber) {
            var subscription = subject.subscribe(subscriber);
            var queryStorage = get();
            queryStorage.refCount += 1;
            return function () {
                subscription.unsubscribe();
                queryStorage.refCount -= 1;
                pendingStorageSet.add(queryStorage);
                commit();
            };
        });
        return {
            subject: subject,
            observable: observable,
        };
    };
    var createQueryStorage = function (queryPayload) {
        var e_2, _a;
        var domainStorage = getDomainStorage(queryPayload.Query.owner);
        var key = getQueryStorageKey(queryPayload);
        var _b = createQuery$(function () { return currentQueryStorage; }), subject = _b.subject, observable = _b.observable;
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
            arg: queryPayload.arg,
            currentValue: currentValue,
            key: key,
            upstreamSet: upstreamSet,
            downstreamSet: downstreamSet,
            subject: subject,
            observable: observable,
            refCount: 0,
        };
        try {
            for (var upstreamSet_1 = tslib_1.__values(upstreamSet), upstreamSet_1_1 = upstreamSet_1.next(); !upstreamSet_1_1.done; upstreamSet_1_1 = upstreamSet_1.next()) {
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
        queryStorageWeakMap.set(queryPayload, currentQueryStorage);
        inspectorManager.inspectQueryStorage(inspector_1.InspectorType.QueryCreated, currentQueryStorage);
        return currentQueryStorage;
    };
    var getQueryStorage = function (queryPayload) {
        var domainStorage = getDomainStorage(queryPayload.Query.owner);
        var key = getQueryStorageKey(queryPayload);
        var queryStorage = domainStorage.queryMap.get(key);
        if (queryStorage) {
            return queryStorage;
        }
        var cachedStorage = queryStorageWeakMap.get(queryPayload);
        if (cachedStorage) {
            var _a = createQuery$(function () { return cachedStorage; }), subject = _a.subject, observable = _a.observable;
            cachedStorage.subject = subject;
            cachedStorage.observable = observable;
            domainStorage.queryMap.set(key, cachedStorage);
            inspectorManager.inspectQueryStorage(inspector_1.InspectorType.QueryRestored, cachedStorage);
            return cachedStorage;
        }
        return createQueryStorage(queryPayload);
    };
    var command$StorageWeakMap = new WeakMap();
    var createCommand$Storage = function (Command$) {
        var domainStorage = getDomainStorage(Command$.owner);
        var subject = new rxjs_1.Subject();
        var observable = subject.asObservable();
        var currentCommand$Storage = {
            type: 'RemeshCommand$Storage',
            Command$: Command$,
            subject: subject,
            observable: observable,
        };
        domainStorage.command$Map.set(Command$, currentCommand$Storage);
        command$StorageWeakMap.set(Command$, currentCommand$Storage);
        return currentCommand$Storage;
    };
    var getCommand$Storage = function (Command$) {
        var domainStorage = getDomainStorage(Command$.owner);
        var command$Storage = domainStorage.command$Map.get(Command$);
        if (command$Storage) {
            return command$Storage;
        }
        var cachedStorage = command$StorageWeakMap.get(Command$);
        if (cachedStorage) {
            var subject = new rxjs_1.Subject();
            var observable = subject.asObservable();
            cachedStorage.subject = subject;
            cachedStorage.observable = observable;
            domainStorage.command$Map.set(Command$, cachedStorage);
            return cachedStorage;
        }
        return createCommand$Storage(Command$);
    };
    var domainStorageWeakMap = new WeakMap();
    var createDomainStorage = function (domainPayload) {
        var e_3, _a;
        var key = getDomainStorageKey(domainPayload);
        var isDomainInited = false;
        var upstreamSet = new Set();
        var command$Set = new Set();
        var domainContext = {
            state: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.state(..) asynchronously");
                }
                if ('default' in options) {
                    var DefaultState = (0, remesh_1.RemeshDefaultState)(options);
                    DefaultState.owner = domainPayload;
                    DefaultState.Query.owner = domainPayload;
                    return DefaultState;
                }
                if (!('impl' in options)) {
                    var DeferState = (0, remesh_1.RemeshDeferState)(options);
                    DeferState.owner = domainPayload;
                    DeferState.Query.owner = domainPayload;
                    return DeferState;
                }
                var State = (0, remesh_1.RemeshState)(options);
                State.owner = domainPayload;
                State.Query.owner = domainPayload;
                return State;
            },
            query: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.query(..) asynchronously");
                }
                var Query = (0, remesh_1.RemeshQuery)(options);
                Query.owner = domainPayload;
                return Query;
            },
            event: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.event(..) asynchronously");
                }
                var Event = (0, remesh_1.RemeshEvent)(options);
                Event.owner = domainPayload;
                return Event;
            },
            command: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.command(..) asynchronously");
                }
                var Command = (0, remesh_1.RemeshCommand)(options);
                Command.owner = domainPayload;
                return Command;
            },
            command$: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.command$(..) asynchronously");
                }
                var Command$ = (0, remesh_1.RemeshCommand$)(options);
                Command$.owner = domainPayload;
                command$Set.add(Command$);
                return Command$;
            },
            commandAsync: function (options) {
                if (isDomainInited) {
                    throw new Error("Unexpected calling domain.command$(..) asynchronously");
                }
                var Command$ = (0, remesh_1.RemeshCommandAsync)(options);
                Command$.owner = domainPayload;
                command$Set.add(Command$);
                return Command$;
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
        var domain = domainPayload.Domain.impl(domainContext, domainPayload.arg);
        isDomainInited = true;
        var currentDomainStorage = {
            type: 'RemeshDomainStorage',
            Domain: domainPayload.Domain,
            arg: domainPayload.arg,
            domain: domain,
            domainPayload: domainPayload,
            key: key,
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
        domainStorageMap.set(key, currentDomainStorage);
        domainStorageWeakMap.set(domainPayload, currentDomainStorage);
        inspectorManager.inspectDomainStorage(inspector_1.InspectorType.DomainCreated, currentDomainStorage);
        try {
            for (var upstreamSet_2 = tslib_1.__values(upstreamSet), upstreamSet_2_1 = upstreamSet_2.next(); !upstreamSet_2_1.done; upstreamSet_2_1 = upstreamSet_2.next()) {
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
        return currentDomainStorage;
    };
    var getDomainStorage = function (domainPayload) {
        var key = getDomainStorageKey(domainPayload);
        var domainStorage = domainStorageMap.get(key);
        if (domainStorage) {
            return domainStorage;
        }
        var cachedStorage = domainStorageWeakMap.get(domainPayload);
        if (cachedStorage) {
            domainStorageMap.set(cachedStorage.key, cachedStorage);
            runDomainStorageIfNeeded(cachedStorage);
            inspectorManager.inspectDomainStorage(inspector_1.InspectorType.DomainRestored, cachedStorage);
            return cachedStorage;
        }
        return createDomainStorage(domainPayload);
    };
    var clearQueryStorage = function (queryStorage) {
        var e_4, _a;
        var domainStorage = getDomainStorage(queryStorage.Query.owner);
        if (!domainStorage.queryMap.has(queryStorage.key)) {
            return;
        }
        inspectorManager.inspectQueryStorage(inspector_1.InspectorType.QueryDestroyed, queryStorage);
        queryStorage.refCount = 0;
        queryStorage.subject.complete();
        domainStorage.queryMap.delete(queryStorage.key);
        try {
            for (var _b = tslib_1.__values(queryStorage.upstreamSet), _c = _b.next(); !_c.done; _c = _b.next()) {
                var upstreamStorage = _c.value;
                upstreamStorage.downstreamSet.delete(queryStorage);
                if (upstreamStorage.type === 'RemeshQueryStorage') {
                    clearQueryStorageIfNeeded(upstreamStorage);
                }
                else if (upstreamStorage.type === 'RemeshStateStorage') {
                    clearStateStorageIfNeeded(upstreamStorage);
                }
                else {
                    throw new Error("Unknown upstream in clearQueryStorageIfNeeded(..): ".concat(upstreamStorage));
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
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
        var domainStorage = getDomainStorage(stateStorage.State.owner);
        if (!domainStorage.stateMap.has(stateStorage.key)) {
            return;
        }
        inspectorManager.inspectStateStorage(inspector_1.InspectorType.StateDestroyed, stateStorage);
        domainStorage.stateMap.delete(stateStorage.key);
    };
    var clearStateStorageIfNeeded = function (stateStorage) {
        if (stateStorage.downstreamSet.size !== 0) {
            return;
        }
        clearStateStorage(stateStorage);
    };
    var clearEventStorage = function (eventStorage) {
        var domainStorage = getDomainStorage(eventStorage.Event.owner);
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
        var _a;
        var domainStorage = getDomainStorage(command$Storage.Command$.owner);
        command$Storage.subject.complete();
        (_a = command$Storage.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        domainStorage.command$Map.delete(command$Storage.Command$);
    };
    var clearDomainStorage = function (domainStorage) {
        var e_5, _a, e_6, _b, e_7, _c, e_8, _d, e_9, _e;
        inspectorManager.inspectDomainStorage(inspector_1.InspectorType.DomainDestroyed, domainStorage);
        var upstreamList = tslib_1.__spreadArray([], tslib_1.__read(domainStorage.upstreamSet), false);
        clearSubscriptionSet(domainStorage.domainSubscriptionSet);
        clearSubscriptionSet(domainStorage.upstreamSubscriptionSet);
        try {
            for (var _f = tslib_1.__values(domainStorage.eventMap.values()), _g = _f.next(); !_g.done; _g = _f.next()) {
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
            for (var _h = tslib_1.__values(domainStorage.queryMap.values()), _j = _h.next(); !_j.done; _j = _h.next()) {
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
            for (var _k = tslib_1.__values(domainStorage.stateMap.values()), _l = _k.next(); !_l.done; _l = _k.next()) {
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
            for (var _m = tslib_1.__values(domainStorage.command$Map.values()), _o = _m.next(); !_o.done; _o = _m.next()) {
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
        domainStorage.refCount = 0;
        domainStorage.running = false;
        domainStorageMap.delete(domainStorage.key);
        try {
            for (var upstreamList_1 = tslib_1.__values(upstreamList), upstreamList_1_1 = upstreamList_1.next(); !upstreamList_1_1.done; upstreamList_1_1 = upstreamList_1.next()) {
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
        return getStateFromStorage(stateStorage);
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
            throw new Error("Unexpected input in ctx.get(..): ".concat(input));
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
            for (var _c = tslib_1.__values(queryStorage.upstreamSet), _d = _c.next(); !_d.done; _d = _c.next()) {
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
        var newValue = Query.impl(queryContext, queryStorage.arg);
        var isEqual = Query.compare(queryStorage.currentValue, newValue);
        if (isEqual) {
            return;
        }
        queryStorage.currentValue = newValue;
        dirtySet.add(queryStorage);
        inspectorManager.inspectQueryStorage(inspector_1.InspectorType.QueryUpdated, queryStorage);
        try {
            /**
             * updateQueryStorage may update upstream.downstreamSet
             * so it should be converted to an array for avoiding infinite loop
             */
            for (var _e = tslib_1.__values(tslib_1.__spreadArray([], tslib_1.__read(queryStorage.downstreamSet), false)), _f = _e.next(); !_f.done; _f = _e.next()) {
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
        var storageList = tslib_1.__spreadArray([], tslib_1.__read(pendingStorageSet), false);
        pendingStorageSet.clear();
        try {
            for (var storageList_1 = tslib_1.__values(storageList), storageList_1_1 = storageList_1.next(); !storageList_1_1.done; storageList_1_1 = storageList_1.next()) {
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
        var queryStorageList = tslib_1.__spreadArray([], tslib_1.__read(dirtySet), false);
        dirtySet.clear();
        try {
            for (var queryStorageList_1 = tslib_1.__values(queryStorageList), queryStorageList_1_1 = queryStorageList_1.next(); !queryStorageList_1_1.done; queryStorageList_1_1 = queryStorageList_1.next()) {
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
        var currentState = getStateFromStorage(stateStorage);
        var isEqual = statePayload.stateItem.State.compare(currentState, statePayload.newState);
        if (isEqual) {
            return;
        }
        stateStorage.currentState = statePayload.newState;
        inspectorManager.inspectStateStorage(inspector_1.InspectorType.StateUpdated, stateStorage);
        try {
            /**
             * updateQueryStorage may update upstream.downstreamSet
             * so it should be converted to an array for avoiding infinite loop
             */
            for (var _b = tslib_1.__values(tslib_1.__spreadArray([], tslib_1.__read(stateStorage.downstreamSet), false)), _c = _b.next(); !_c.done; _c = _b.next()) {
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
        inspectorManager.inspectEventEmitted(inspector_1.InspectorType.EventEmitted, eventPayload);
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
        inspectorManager.inspectCommandReceived(inspector_1.InspectorType.CommandReceived, commandPayload);
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
        if (commandOutput === null) {
            return;
        }
        if (Array.isArray(commandOutput)) {
            try {
                for (var commandOutput_1 = tslib_1.__values(commandOutput), commandOutput_1_1 = commandOutput_1.next(); !commandOutput_1_1.done; commandOutput_1_1 = commandOutput_1.next()) {
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
        throw new Error("Unknown command output of ".concat(commandOutput));
    };
    var handleCommand$Payload = function (command$Payload) {
        inspectorManager.inspectCommand$Received(inspector_1.InspectorType.Command$Received, command$Payload);
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
    var getBindingCommand = function (domain) {
        var command = {};
        var _loop_1 = function (key) {
            var Command = domain.command[key];
            command[key] = function (arg) { return sendCommand(Command(arg)); };
        };
        for (var key in domain.command) {
            _loop_1(key);
        }
        return command;
    };
    var getDomain = function (domainPayload) {
        var domainStorage = getDomainStorage(domainPayload);
        if (domainStorage.domainOutput) {
            return domainStorage.domainOutput;
        }
        var domain = domainStorage.domain;
        var command = getBindingCommand(domain);
        var domainOutput = tslib_1.__assign(tslib_1.__assign({}, domain), { command: command });
        domainStorage.domainOutput = domainOutput;
        return domainOutput;
    };
    var initCommand$Set = function (command$Set) {
        var e_16, _a;
        try {
            for (var command$Set_1 = tslib_1.__values(command$Set), command$Set_1_1 = command$Set_1.next(); !command$Set_1_1.done; command$Set_1_1 = command$Set_1.next()) {
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
    };
    var runDomainStorageIfNeeded = function (domainStorage) {
        var e_17, _a;
        if (domainStorage.running) {
            return;
        }
        domainStorage.running = true;
        try {
            for (var _b = tslib_1.__values(domainStorage.upstreamSet), _c = _b.next(); !_c.done; _c = _b.next()) {
                var upstreamDomainStorage = _c.value;
                var upstreamDomainSubscription = subscribeDomain(upstreamDomainStorage.domainPayload);
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
    var subscribeDomain = function (domainPayload) {
        var domainStorage = getDomainStorage(domainPayload);
        var domainSubscription = new rxjs_1.Subscription();
        addDomainSubscription(domainStorage, domainSubscription);
        runDomainStorageIfNeeded(domainStorage);
        return domainSubscription;
    };
    var destroy = function () {
        var e_18, _a;
        inspectorManager.destroyInspectors();
        try {
            for (var _b = tslib_1.__values(domainStorageMap.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
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
    var sendCommand = function (input) {
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
        sendCommand: sendCommand,
        destroy: destroy,
        subscribeQuery: subscribeQuery,
        subscribeEvent: subscribeEvent,
        subscribeDomain: subscribeDomain,
        getKey: getStorageKey,
    };
};
exports.RemeshStore = RemeshStore;
var clearSubscriptionSet = function (subscriptionSet) {
    var e_19, _a;
    try {
        for (var subscriptionSet_1 = tslib_1.__values(subscriptionSet), subscriptionSet_1_1 = subscriptionSet_1.next(); !subscriptionSet_1_1.done; subscriptionSet_1_1 = subscriptionSet_1.next()) {
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
//# sourceMappingURL=store.js.map