"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemeshModule = exports.RemeshDomain = exports.RemeshExtern = exports.RemeshCommand$ = exports.RemeshCommand = exports.RemeshQuery = exports.RemeshState = exports.defaultCompare = exports.RemeshDefaultState = exports.RemeshEvent = void 0;
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
//# sourceMappingURL=remesh.js.map