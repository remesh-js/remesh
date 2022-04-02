"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDomain = exports.RemeshDomain = exports.RemeshExtern = exports.RemeshCommandAsync = exports.RemeshCommand$ = exports.RemeshCommand = exports.RemeshQuery = exports.RemeshState = exports.defaultCompare = exports.RemeshDeferState = exports.RemeshDefaultState = exports.RemeshEvent = exports.undefined2Void = void 0;
var tslib_1 = require("tslib");
var rxjs_1 = require("rxjs");
var shallowequal_1 = tslib_1.__importDefault(require("shallowequal"));
var is_plain_object_1 = require("is-plain-object");
var undefined2Void = function (value) {
    return value;
};
exports.undefined2Void = undefined2Void;
var eventUid = 0;
function RemeshEvent(options) {
    var _a;
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
    Event.owner = (0, exports.DefaultDomain)();
    Event.inspectable = 'inspectable' in options ? (_a = options.inspectable) !== null && _a !== void 0 ? _a : true : true;
    if ('impl' in options) {
        Event.impl = options.impl;
    }
    return Event;
}
exports.RemeshEvent = RemeshEvent;
var RemeshDefaultState = function (options) {
    return (0, exports.RemeshState)({
        name: options.name,
        impl: function () { return options.default; },
        inspectable: options.inspectable,
        compare: options.compare,
    });
};
exports.RemeshDefaultState = RemeshDefaultState;
var RemeshDeferState = function (options) {
    return (0, exports.RemeshState)({
        name: options.name,
        defer: true,
        impl: function (_arg) {
            throw new Error("RemeshDeferState: ".concat(options.name, " is not resolved"));
        },
        inspectable: options.inspectable,
        compare: options.compare,
    });
};
exports.RemeshDeferState = RemeshDeferState;
var stateUid = 0;
var defaultCompare = function (prev, curr) {
    if ((0, is_plain_object_1.isPlainObject)(prev) && (0, is_plain_object_1.isPlainObject)(curr)) {
        return (0, shallowequal_1.default)(prev, curr);
    }
    return prev === curr;
};
exports.defaultCompare = defaultCompare;
var RemeshState = function (options) {
    var _a, _b, _c;
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
    State.owner = (0, exports.DefaultDomain)();
    State.inspectable = (_b = options.inspectable) !== null && _b !== void 0 ? _b : true;
    State.defer = (_c = options.defer) !== null && _c !== void 0 ? _c : false;
    State.Query = (0, exports.RemeshQuery)({
        name: "".concat(options.name, ".Query"),
        inspectable: false,
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
    var _a, _b;
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
    Query.owner = (0, exports.DefaultDomain)();
    Query.inspectable = (_b = options.inspectable) !== null && _b !== void 0 ? _b : true;
    return Query;
};
exports.RemeshQuery = RemeshQuery;
var commandUid = 0;
var RemeshCommand = function (options) {
    var _a;
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
    Command.owner = (0, exports.DefaultDomain)();
    Command.inspectable = (_a = options.inspectable) !== null && _a !== void 0 ? _a : true;
    return Command;
};
exports.RemeshCommand = RemeshCommand;
var command$Uid = 0;
var RemeshCommand$ = function (options) {
    var _a;
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
    Command$.owner = (0, exports.DefaultDomain)();
    Command$.inspectable = (_a = options.inspectable) !== null && _a !== void 0 ? _a : true;
    return Command$;
};
exports.RemeshCommand$ = RemeshCommand$;
var RemeshCommandAsync = function (options) {
    var Command$ = (0, exports.RemeshCommand$)({
        name: options.name,
        inspectable: options.inspectable,
        impl: function (context, arg$) {
            if (!options.mode || options.mode === 'switch') {
                return arg$.pipe((0, rxjs_1.switchMap)(function (arg) { return options.impl(context, arg); }));
            }
            if (options.mode === 'merge') {
                return arg$.pipe((0, rxjs_1.mergeMap)(function (arg) { return options.impl(context, arg); }));
            }
            if (options.mode === 'concat') {
                return arg$.pipe((0, rxjs_1.concatMap)(function (arg) { return options.impl(context, arg); }));
            }
            if (options.mode === 'exhaust') {
                return arg$.pipe((0, rxjs_1.exhaustMap)(function (arg) { return options.impl(context, arg); }));
            }
            throw new Error("RemeshCommandAsync: invalid mode: ".concat(options.mode));
        },
    });
    return Command$;
};
exports.RemeshCommandAsync = RemeshCommandAsync;
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
    var _a;
    /**
     * optimize for nullary domain
     */
    var cacheForNullary = null;
    var Domain = (function (arg) {
        if (arg === undefined && cacheForNullary) {
            return cacheForNullary;
        }
        var result = {
            type: 'RemeshDomainPayload',
            Domain: Domain,
            arg: arg,
        };
        if (arg === undefined) {
            cacheForNullary = result;
        }
        return result;
    });
    Domain.type = 'RemeshDomain';
    Domain.domainId = domainUid++;
    Domain.domainName = options.name;
    Domain.impl = options.impl;
    Domain.inspectable = (_a = options.inspectable) !== null && _a !== void 0 ? _a : true;
    return Domain;
};
exports.RemeshDomain = RemeshDomain;
exports.DefaultDomain = (0, exports.RemeshDomain)({
    name: 'DefaultDomain',
    impl: function () {
        return {};
    },
});
//# sourceMappingURL=remesh.js.map