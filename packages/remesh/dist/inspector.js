"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInspectorManager = exports.isInspectable = exports.RemeshInspectorDomain = exports.InspectorType = void 0;
var tslib_1 = require("tslib");
var remesh_1 = require("./remesh");
exports.InspectorType = {
    DomainCreated: 'Domain::Created',
    DomainDestroyed: 'Domain::Destroyed',
    DomainRestored: 'Domain::Restored',
    StateCreated: 'State::Created',
    StateUpdated: 'State::Updated',
    StateDestroyed: 'State::Destroyed',
    StateRestored: 'State::Restored',
    QueryCreated: 'Query::Created',
    QueryUpdated: 'Query::Updated',
    QueryDestroyed: 'Query::Destroyed',
    QueryRestored: 'Query::Restored',
    EventEmitted: 'Event::Emitted',
    CommandReceived: 'Command::Received',
    Command$Received: 'Command$::Received',
};
exports.RemeshInspectorDomain = (0, remesh_1.RemeshDomain)({
    name: 'RemeshInspector',
    impl: function (domain) {
        var RemeshDomainStorageEvent = domain.event({
            name: 'RemeshDomainStorageEvent',
        });
        var RemeshStateStorageEvent = domain.event({
            name: 'RemeshStateStorageEvent',
        });
        var RemeshQueryStorageEvent = domain.event({
            name: 'RemeshQueryStorageEvent',
        });
        var RemeshEventEmittedEvent = domain.event({
            name: 'RemeshEventEmitted',
        });
        var RemeshCommandReceivedEvent = domain.event({
            name: 'RemeshCommandReceived',
        });
        var RemeshCommand$ReceivedEvent = domain.event({
            name: 'RemeshCommand$Received',
        });
        return {
            event: {
                RemeshDomainStorageEvent: RemeshDomainStorageEvent,
                RemeshStateStorageEvent: RemeshStateStorageEvent,
                RemeshQueryStorageEvent: RemeshQueryStorageEvent,
                RemeshEventEmittedEvent: RemeshEventEmittedEvent,
                RemeshCommandReceivedEvent: RemeshCommandReceivedEvent,
                RemeshCommand$ReceivedEvent: RemeshCommand$ReceivedEvent,
            },
        };
    },
});
var isInspectable = function (input) {
    if (input.owner) {
        return input.owner.Domain.inspectable && input.inspectable;
    }
    return input.inspectable;
};
exports.isInspectable = isInspectable;
var initInspectors = function (options) {
    var _a;
    return ((_a = options.inspectors) !== null && _a !== void 0 ? _a : [])
        .filter(function (inspector) { return !!inspector; })
        .map(function (inspector) {
        var inspectors = options.inspectors, rest = tslib_1.__rest(options, ["inspectors"]);
        return inspector(rest);
    });
};
var createInspectorManager = function (options) {
    var inspectors = null;
    var getInspectors = function () {
        if (!inspectors) {
            inspectors = initInspectors(options);
        }
        return inspectors;
    };
    var destroyInspectors = function () {
        var e_1, _a;
        if (inspectors) {
            try {
                for (var inspectors_1 = tslib_1.__values(inspectors), inspectors_1_1 = inspectors_1.next(); !inspectors_1_1.done; inspectors_1_1 = inspectors_1.next()) {
                    var inspector = inspectors_1_1.value;
                    inspector.destroy();
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (inspectors_1_1 && !inspectors_1_1.done && (_a = inspectors_1.return)) _a.call(inspectors_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            inspectors = null;
        }
    };
    var inspectDomainStorage = function (type, domainStorage) {
        var e_2, _a;
        if ((0, exports.isInspectable)(domainStorage.Domain)) {
            try {
                for (var _b = tslib_1.__values(getInspectors()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inspector = _c.value;
                    var inspectorDomain = inspector.getDomain((0, exports.RemeshInspectorDomain)());
                    var event_1 = inspectorDomain.event.RemeshDomainStorageEvent({
                        type: type,
                        storage: domainStorage,
                    });
                    inspector.emitEvent(event_1);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    };
    var inspectStateStorage = function (type, stateStorage) {
        var e_3, _a;
        if ((0, exports.isInspectable)(stateStorage.State)) {
            try {
                for (var _b = tslib_1.__values(getInspectors()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inspector = _c.value;
                    var inspectorDomain = inspector.getDomain((0, exports.RemeshInspectorDomain)());
                    var event_2 = inspectorDomain.event.RemeshStateStorageEvent({
                        type: type,
                        storage: stateStorage,
                    });
                    inspector.emitEvent(event_2);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
    };
    var inspectQueryStorage = function (type, queryStorage) {
        var e_4, _a;
        if ((0, exports.isInspectable)(queryStorage.Query)) {
            try {
                for (var _b = tslib_1.__values(getInspectors()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inspector = _c.value;
                    var inspectorDomain = inspector.getDomain((0, exports.RemeshInspectorDomain)());
                    var event_3 = inspectorDomain.event.RemeshQueryStorageEvent({
                        type: type,
                        storage: queryStorage,
                    });
                    inspector.emitEvent(event_3);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
    };
    var inspectEventEmitted = function (type, eventPayload) {
        var e_5, _a;
        if ((0, exports.isInspectable)(eventPayload.Event)) {
            try {
                for (var _b = tslib_1.__values(getInspectors()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inspector = _c.value;
                    var inspectorDomain = inspector.getDomain((0, exports.RemeshInspectorDomain)());
                    var event_4 = inspectorDomain.event.RemeshEventEmittedEvent({
                        type: type,
                        payload: eventPayload,
                    });
                    inspector.emitEvent(event_4);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }
    };
    var inspectCommandReceived = function (type, commandPayload) {
        var e_6, _a;
        if ((0, exports.isInspectable)(commandPayload.Command)) {
            try {
                for (var _b = tslib_1.__values(getInspectors()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inspector = _c.value;
                    var inspectorDomain = inspector.getDomain((0, exports.RemeshInspectorDomain)());
                    var event_5 = inspectorDomain.event.RemeshCommandReceivedEvent({
                        type: type,
                        payload: commandPayload,
                    });
                    inspector.emitEvent(event_5);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
    };
    var inspectCommand$Received = function (type, command$Payload) {
        var e_7, _a;
        if ((0, exports.isInspectable)(command$Payload.Command$)) {
            try {
                for (var _b = tslib_1.__values(getInspectors()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var inspector = _c.value;
                    var inspectorDomain = inspector.getDomain((0, exports.RemeshInspectorDomain)());
                    var event_6 = inspectorDomain.event.RemeshCommand$ReceivedEvent({
                        type: type,
                        payload: command$Payload,
                    });
                    inspector.emitEvent(event_6);
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_7) throw e_7.error; }
            }
        }
    };
    return {
        destroyInspectors: destroyInspectors,
        inspectDomainStorage: inspectDomainStorage,
        inspectStateStorage: inspectStateStorage,
        inspectQueryStorage: inspectQueryStorage,
        inspectEventEmitted: inspectEventEmitted,
        inspectCommandReceived: inspectCommandReceived,
        inspectCommand$Received: inspectCommand$Received,
    };
};
exports.createInspectorManager = createInspectorManager;
//# sourceMappingURL=inspector.js.map