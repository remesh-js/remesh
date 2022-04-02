"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchModule = void 0;
var SwitchModule = function (domain, options) {
    var SwitchState = domain.state({
        name: "".concat(options.name, ".SwitchState"),
        default: options.default,
    });
    var SwitchQuery = domain.query({
        name: "".concat(options.name, ".SwitchQuery"),
        impl: function (_a) {
            var get = _a.get;
            return get(SwitchState());
        },
    });
    var SwitchedEvent = domain.event({
        name: "".concat(options.name, ".SwitchedEvent"),
    });
    var switchTo = domain.command({
        name: "".concat(options.name, ".switchTo"),
        impl: function (_a, current) {
            var get = _a.get;
            var previous = get(SwitchState());
            var result = [SwitchState().new(current), SwitchedEvent({ previous: previous, current: current })];
            return result;
        },
    });
    return {
        query: {
            SwitchQuery: SwitchQuery,
        },
        command: {
            switchTo: switchTo,
        },
        event: {
            SwitchedEvent: SwitchedEvent,
        },
    };
};
exports.SwitchModule = SwitchModule;
//# sourceMappingURL=switch.js.map