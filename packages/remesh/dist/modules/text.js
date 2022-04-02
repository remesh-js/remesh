"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextModule = void 0;
var tslib_1 = require("tslib");
var TextModule = function (domain, options) {
    var _a;
    var TextState = domain.state({
        name: "".concat(options.name, ".TextState"),
        default: (_a = options.default) !== null && _a !== void 0 ? _a : ''
    });
    var TextQuery = domain.query({
        name: "".concat(options.name, ".InputQuery"),
        impl: function (_a) {
            var get = _a.get;
            return get(TextState());
        },
    });
    var TextChangedEvent = domain.event({
        name: "".concat(options.name, ".TextChangedEvent"),
    });
    var setText = domain.command({
        name: "".concat(options.name, ".setText"),
        impl: function (_a, current) {
            var get = _a.get;
            var previous = get(TextState());
            var result = [TextState().new(current), TextChangedEvent({ previous: previous, current: current })];
            if (current === '') {
                return tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(result), false), [TextClearedEvent({ previous: previous })], false);
            }
            return result;
        },
    });
    var TextClearedEvent = domain.event({
        name: "".concat(options.name, ".InputClearedEvent"),
    });
    var clearText = domain.command({
        name: "".concat(options.name, ".clearText"),
        impl: function () {
            return setText('');
        },
    });
    return {
        query: {
            TextQuery: TextQuery,
        },
        command: {
            setText: setText,
            clearText: clearText,
        },
        event: {
            TextChangedEvent: TextChangedEvent,
            TextClearedEvent: TextClearedEvent,
        },
    };
};
exports.TextModule = TextModule;
//# sourceMappingURL=text.js.map