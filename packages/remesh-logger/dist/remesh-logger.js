"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemeshLogger = void 0;
var tslib_1 = require("tslib");
var remesh_1 = require("remesh");
var remesh_debugger_helper_1 = require("remesh-debugger-helper");
var RemeshLogger = function (options) {
    return function (storeOptions) {
        var _a;
        var config = tslib_1.__assign({ collapsed: true }, options);
        var helper = (0, remesh_debugger_helper_1.RemeshDebuggerHelper)(config);
        var log = function (type, info) {
            if (config.collapsed) {
                var parts = type.split('::');
                console.groupCollapsed("%c".concat(parts[0], "%c::%c").concat(parts[1], "%c::%c").concat(parts[2], "%c @ ").concat((0, remesh_debugger_helper_1.formatNow)()), 'color:#03A9F4; font-weight: bold', 'color:#9E9E9E; font-weight: bold', 'color:#4CAF50; font-weight: bold', 'color:#9E9E9E; font-weight: bold', 'color:#AA07DE; font-weight: bold', "color:#9E9E9E; font-weight: lighter");
            }
            console.log(info);
            if (config.collapsed) {
                console.groupEnd();
            }
        };
        var store = remesh_1.Remesh.store(tslib_1.__assign(tslib_1.__assign({}, storeOptions), { name: "RemeshLogger(".concat((_a = storeOptions === null || storeOptions === void 0 ? void 0 : storeOptions.name) !== null && _a !== void 0 ? _a : '', ")") }));
        var inspectorDomain = store.getDomain((0, remesh_1.RemeshInspectorDomain)());
        var getOwnerInfo = function (owner) {
            var ownerInfo = {
                domainId: owner.Domain.domainId,
                domainName: owner.Domain.domainName,
            };
            if (owner.arg !== undefined) {
                return tslib_1.__assign(tslib_1.__assign({}, ownerInfo), { domainArg: owner.arg });
            }
            return ownerInfo;
        };
        helper.onActive('domain', function () {
            store.subscribeEvent(inspectorDomain.event.RemeshDomainStorageEvent, function (event) {
                var Domain = event.storage.Domain;
                var info = {
                    type: "".concat(event.type, "::").concat(Domain.domainName),
                    domainId: Domain.domainId,
                    domainName: Domain.domainName,
                };
                if (event.storage.arg !== undefined) {
                    log(info.type, tslib_1.__assign(tslib_1.__assign({}, info), { domainArg: event.storage.arg }));
                }
                else {
                    log(info.type, info);
                }
            });
        });
        helper.onActive('state', function () {
            store.subscribeEvent(inspectorDomain.event.RemeshStateStorageEvent, function (event) {
                var State = event.storage.State;
                var info = {
                    type: "".concat(event.type, "::").concat(State.stateName),
                    owner: getOwnerInfo(State.owner),
                    stateId: State.stateId,
                    stateName: State.stateName,
                    stateValue: event.storage.currentState,
                };
                if (event.storage.arg !== undefined) {
                    log(info.type, tslib_1.__assign(tslib_1.__assign({}, info), { stateArg: event.storage.arg }));
                }
                else {
                    log(info.type, info);
                }
            });
        });
        helper.onActive('query', function () {
            store.subscribeEvent(inspectorDomain.event.RemeshQueryStorageEvent, function (event) {
                var Query = event.storage.Query;
                var info = {
                    type: "".concat(event.type, "::").concat(Query.queryName),
                    owner: getOwnerInfo(Query.owner),
                    queryId: Query.queryId,
                    queryName: Query.queryName,
                    queryValue: event.storage.currentValue,
                };
                if (event.storage.arg !== undefined) {
                    log(info.type, tslib_1.__assign(tslib_1.__assign({}, info), { queryArg: event.storage.arg }));
                }
                else {
                    log(info.type, info);
                }
            });
        });
        helper.onActive('command', function () {
            store.subscribeEvent(inspectorDomain.event.RemeshCommandReceivedEvent, function (event) {
                var Command = event.payload.Command;
                var info = {
                    type: "".concat(event.type, "::").concat(Command.commandName),
                    owner: getOwnerInfo(Command.owner),
                    commandId: Command.commandId,
                    commandName: Command.commandName,
                };
                if (event.payload.arg !== undefined) {
                    log(info.type, tslib_1.__assign(tslib_1.__assign({}, info), { commandArg: event.payload.arg }));
                }
                else {
                    log(info.type, info);
                }
            });
        });
        helper.onActive('command$', function () {
            store.subscribeEvent(inspectorDomain.event.RemeshCommand$ReceivedEvent, function (event) {
                var Command$ = event.payload.Command$;
                var info = {
                    type: "".concat(event.type, "::").concat(Command$.command$Name),
                    owner: getOwnerInfo(Command$.owner),
                    command$Id: Command$.command$Id,
                    command$Name: Command$.command$Name,
                };
                if (event.payload.arg !== undefined) {
                    log(info.type, tslib_1.__assign(tslib_1.__assign({}, info), { command$Arg: event.payload.arg }));
                }
                else {
                    log(info.type, info);
                }
            });
        });
        helper.onActive('event', function () {
            store.subscribeEvent(inspectorDomain.event.RemeshEventEmittedEvent, function (event) {
                var Event = event.payload.Event;
                var info = {
                    type: "".concat(event.type, "::").concat(Event.eventName),
                    owner: getOwnerInfo(Event.owner),
                    eventId: Event.eventId,
                    eventName: Event.eventName,
                };
                if (event.payload.arg !== undefined) {
                    log(info.type, tslib_1.__assign(tslib_1.__assign({}, info), { eventArg: event.payload.arg }));
                }
                else {
                    log(info.type, info);
                }
            });
        });
        return store;
    };
};
exports.RemeshLogger = RemeshLogger;
//# sourceMappingURL=remesh-logger.js.map