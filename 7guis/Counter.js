"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterApp = void 0;
var react_1 = require("react");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
var Counter = remesh_1.Remesh.domain({
    name: 'Counter',
    impl: function (domain) {
        var CounterState = domain.state({
            name: 'CounterState',
            default: 0,
        });
        var incre = domain.command({
            name: 'increCommand',
            impl: function (_a) {
                var get = _a.get;
                var count = get(CounterState());
                return CounterState().new(count + 1);
            },
        });
        return {
            query: {
                CounterQuery: CounterState.Query,
            },
            command: {
                incre: incre,
            },
        };
    },
});
var CounterApp = function () {
    var counter = (0, react_2.useRemeshDomain)(Counter);
    var count = (0, react_2.useRemeshQuery)(counter.query.CounterQuery());
    var handleIncre = function () {
        counter.command.incre();
    };
    return (react_1.default.createElement("div", { style: {
            width: 400,
            border: '1px solid #eaeaea',
            boxSizing: 'border-box',
            padding: 10,
        } },
        react_1.default.createElement("h2", null, "Counter"),
        react_1.default.createElement("input", { type: "number", readOnly: true, value: count }),
        react_1.default.createElement("label", null,
            react_1.default.createElement("button", { onClick: handleIncre }, "Count "),
            ' ')));
};
exports.CounterApp = CounterApp;
//# sourceMappingURL=Counter.js.map