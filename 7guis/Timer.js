"use strict";
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
exports.TimerApp = void 0;
var react_1 = require("react");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
var Timer = remesh_1.Remesh.domain({
    name: 'timer',
    impl: function (domain) {
        var DurationState = domain.state({
            name: 'duration',
            default: 15000,
        });
        var ElapsedState = domain.state({
            name: 'elapsed',
            default: 0,
        });
        var StartEvent = domain.event({
            name: 'StartEvent',
        });
        var StopEvent = domain.event({
            name: 'StopEvent',
        });
        var updateElapsed = domain.command({
            name: 'updateElapsed',
            impl: function (_a, increment) {
                var get = _a.get;
                var duration = get(DurationState());
                var elapsed = get(ElapsedState());
                if (elapsed > duration) {
                    return StopEvent();
                }
                return ElapsedState().new(elapsed + increment);
            },
        });
        var updateDuration = domain.command({
            name: 'updateDuration',
            impl: function (_a, newDuration) {
                var get = _a.get;
                var elapsed = get(ElapsedState());
                if (newDuration > elapsed) {
                    return [DurationState().new(newDuration), StartEvent()];
                }
                return DurationState().new(newDuration);
            },
        });
        var resetElapsed = domain.command({
            name: 'resetElapsed',
            impl: function (_a) {
                return [ElapsedState().new(0), StartEvent()];
            },
        });
        domain.command$({
            name: 'updateElapsed$',
            impl: function (_a) {
                var fromEvent = _a.fromEvent;
                var event$ = (0, rxjs_1.merge)(fromEvent(StartEvent).pipe((0, operators_1.mapTo)(1)), fromEvent(StopEvent).pipe((0, operators_1.mapTo)(0))).pipe((0, operators_1.distinctUntilChanged)());
                var main$ = event$.pipe((0, operators_1.switchMap)(function (signal) {
                    if (signal === 0) {
                        return rxjs_1.NEVER;
                    }
                    return (0, rxjs_1.animationFrames)().pipe((0, operators_1.pairwise)(), (0, operators_1.map)(function (_a) {
                        var _b = __read(_a, 2), a = _b[0], b = _b[1];
                        return b.elapsed - a.elapsed;
                    }), (0, operators_1.map)(function (increment) { return updateElapsed(increment); }), (0, operators_1.takeUntil)(fromEvent(StopEvent)));
                }));
                return (0, rxjs_1.merge)(main$, (0, rxjs_1.of)(StartEvent()));
            },
        });
        return {
            query: {
                DurationQuery: DurationState.Query,
                ElapsedQuery: ElapsedState.Query,
            },
            command: {
                resetElapsed: resetElapsed,
                updateDuration: updateDuration,
            },
        };
    },
});
var TimerApp = function () {
    var timer = (0, react_2.useRemeshDomain)(Timer);
    var elapsed = (0, react_2.useRemeshQuery)(timer.query.ElapsedQuery());
    var duration = (0, react_2.useRemeshQuery)(timer.query.DurationQuery());
    var handleDurationChange = function (event) {
        var duration = parseInt(event.target.value, 10);
        if (!isNaN(duration)) {
            timer.command.updateDuration(duration);
        }
    };
    var handleResetElapsed = function () {
        timer.command.resetElapsed();
    };
    return (react_1.default.createElement("div", { style: {
            width: 400,
            border: '1px solid #eaeaea',
            boxSizing: 'border-box',
            padding: 10,
        } },
        react_1.default.createElement("h2", null, "Timer"),
        react_1.default.createElement("div", { style: { display: 'flex' } },
            react_1.default.createElement("label", { style: { marginRight: 10, whiteSpace: 'nowrap' } }, "Elapsed Timer:"),
            react_1.default.createElement("div", { style: { width: '100%' } },
                react_1.default.createElement("span", { style: {
                        display: 'inline-block',
                        height: 10,
                        background: 'green',
                        width: Math.min(elapsed / duration, 1) * 100 + "%",
                        verticalAlign: 'middle',
                        borderRadius: 5,
                    } }))),
        react_1.default.createElement("div", null,
            elapsed > duration
                ? (duration / 1000).toFixed(1)
                : (elapsed / 1000).toFixed(1),
            "s"),
        react_1.default.createElement("div", { style: { display: 'flex' } },
            react_1.default.createElement("label", { style: { width: 100, marginRight: 10 } }, "Duration:"),
            react_1.default.createElement("input", { style: { width: '100%' }, type: "range", min: 0, max: 30000, value: duration, onChange: handleDurationChange })),
        react_1.default.createElement("div", null,
            react_1.default.createElement("button", { style: { width: '100% ' }, onClick: handleResetElapsed }, "Reset Timer"))));
};
exports.TimerApp = TimerApp;
//# sourceMappingURL=Timer.js.map