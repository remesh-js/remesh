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
exports.CircleDrawerApp = void 0;
var react_1 = require("react");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
var OuterClickWrapper_1 = require("./OuterClickWrapper");
var CircleDrawer = remesh_1.Remesh.domain({
    name: 'CircleDrawer',
    impl: function (domain) {
        var HistoryState = domain.state({
            name: 'HistoryState',
            default: {
                items: [],
                currentIndex: -1,
            },
        });
        var recordHistoryState = domain.command({
            name: 'recordHistoryState',
            impl: function (_a, state) {
                var get = _a.get;
                var history = get(HistoryState());
                var previousItems = history.items.slice(0, history.currentIndex + 1);
                /**
                 * If the current state is the same as the last state,
                 * then we don't need to record it.
                 * This is because we are going to replace the last state
                 * with the current state.
                 *
                 * This is a bit of a hack, but it works.
                 *
                 * TODO: Find a better way to do this.
                 */
                if (state.action === 'adjust-circle') {
                    var lastState = previousItems[previousItems.length - 1];
                    if (lastState.action === 'adjust-circle' &&
                        lastState.index === state.index) {
                        previousItems.pop();
                    }
                }
                var newItems = __spreadArray(__spreadArray([], __read(previousItems), false), [state], false);
                var newIndex = newItems.length - 1;
                return HistoryState().new({
                    items: newItems,
                    currentIndex: newIndex,
                });
            },
        });
        var DrawState = domain.state({
            name: 'DrawState',
            default: {
                circles: [],
            },
        });
        var undo = domain.command({
            name: 'undo',
            impl: function (_a) {
                var get = _a.get;
                var history = get(HistoryState());
                var canUndo = get(CanUndoQuery());
                var newIndex = history.currentIndex - 1;
                if (!canUndo || newIndex < 0) {
                    return [
                        DrawState().new({
                            circles: [],
                        }),
                        HistoryState().new({
                            items: history.items,
                            currentIndex: -1,
                        }),
                    ];
                }
                return [
                    DrawState().new(history.items[newIndex].state),
                    HistoryState().new({
                        items: history.items,
                        currentIndex: newIndex,
                    }),
                ];
            },
        });
        var redo = domain.command({
            name: 'redo',
            impl: function (_a) {
                var get = _a.get;
                var history = get(HistoryState());
                var canRedo = get(CanRedoQuery());
                if (!canRedo) {
                    return [];
                }
                var newIndex = history.currentIndex + 1;
                return [
                    DrawState().new(history.items[newIndex].state),
                    HistoryState().new({
                        items: history.items,
                        currentIndex: newIndex,
                    }),
                ];
            },
        });
        var CanUndoQuery = domain.query({
            name: 'CanUndoQuery',
            impl: function (_a) {
                var get = _a.get;
                var history = get(HistoryState());
                return history.currentIndex >= 0;
            },
        });
        var CanRedoQuery = domain.query({
            name: 'CanRedoQuery',
            impl: function (_a) {
                var get = _a.get;
                var history = get(HistoryState());
                return history.currentIndex < history.items.length - 1;
            },
        });
        var SelectedIndexState = domain.state({
            name: 'SelectedIndexState',
            default: -1,
        });
        var setSelectedIndex = domain.command({
            name: 'setSelectedIndex',
            impl: function (_a, index) {
                return SelectedIndexState().new(index);
            },
        });
        var SelectedCircleInfoQuery = domain.query({
            name: 'SelectedCircleInfoQuery',
            impl: function (_a) {
                var get = _a.get;
                var index = get(SelectedIndexState());
                var circles = get(DrawState()).circles;
                if (index === -1) {
                    return null;
                }
                return {
                    index: index,
                    circle: circles[index],
                };
            },
        });
        var draw = domain.command({
            name: 'draw',
            impl: function (_a, action) {
                var get = _a.get;
                var state = get(DrawState());
                var newState = {
                    circles: __spreadArray(__spreadArray([], __read(state.circles), false), [
                        { position: action.position, diameter: action.diameter },
                    ], false),
                };
                return [
                    DrawState().new(newState),
                    recordHistoryState({
                        action: 'add-circle',
                        state: newState,
                    }),
                ];
            },
        });
        var adjust = domain.command({
            name: 'adjust',
            impl: function (_a, action) {
                var get = _a.get;
                var state = get(DrawState());
                var circles = state.circles.map(function (circle, index) {
                    if (index === action.index) {
                        return {
                            position: circle.position,
                            diameter: action.diameter,
                        };
                    }
                    return circle;
                });
                var newState = {
                    circles: circles,
                };
                return [
                    DrawState().new(newState),
                    recordHistoryState({
                        action: 'adjust-circle',
                        index: action.index,
                        state: newState,
                    }),
                ];
            },
        });
        var TooltipsState = domain.state({
            name: 'TooltipsState',
            default: {
                type: 'default',
            },
        });
        var updateTooltips = domain.command({
            name: 'updateTooltips',
            impl: function (_a, newState) {
                return TooltipsState().new(newState);
            },
        });
        return {
            query: {
                HistoryQuery: HistoryState.Query,
                DrawQuery: DrawState.Query,
                TooltipsQuery: TooltipsState.Query,
                SelectedIndexQuery: SelectedIndexState.Query,
                SelectedCircleInfoQuery: SelectedCircleInfoQuery,
                CanUndoQuery: CanUndoQuery,
                CanRedoQuery: CanRedoQuery,
            },
            command: {
                draw: draw,
                adjust: adjust,
                updateTooltips: updateTooltips,
                undo: undo,
                redo: redo,
                setSelectedIndex: setSelectedIndex,
            },
        };
    },
});
var positionInCircle = function (position, circle) {
    var x = position.x, y = position.y;
    var diameter = circle.diameter, circlePosition = circle.position;
    var circleX = circlePosition.x, circleY = circlePosition.y;
    var radius = diameter / 2;
    var dx = x - circleX;
    var dy = y - circleY;
    return dx * dx + dy * dy < radius * radius;
};
var CircleDrawerApp = function () {
    var _a;
    var domain = (0, react_2.useRemeshDomain)(CircleDrawer);
    var drawState = (0, react_2.useRemeshQuery)(domain.query.DrawQuery());
    var tooltipsState = (0, react_2.useRemeshQuery)(domain.query.TooltipsQuery());
    var selectedCircleInfo = (0, react_2.useRemeshQuery)(domain.query.SelectedCircleInfoQuery());
    var canUndo = (0, react_2.useRemeshQuery)(domain.query.CanUndoQuery());
    var canRedo = (0, react_2.useRemeshQuery)(domain.query.CanRedoQuery());
    var getCircleInfo = function (position) {
        var circle = drawState.circles.find(function (circle) {
            return positionInCircle(position, circle);
        });
        if (!circle) {
            return null;
        }
        var index = drawState.circles.indexOf(circle);
        return {
            index: index,
            circle: circle,
        };
    };
    var handleRightClick = function (e) {
        e.preventDefault();
        var position = { x: e.pageX, y: e.pageY };
        var circleInfo = getCircleInfo(position);
        if (circleInfo) {
            domain.command.setSelectedIndex(circleInfo.index);
            domain.command.updateTooltips({
                type: 'show-tips',
                index: circleInfo.index,
                circle: circleInfo.circle,
                pageX: e.pageX,
                pageY: e.pageY,
            });
        }
    };
    var handleLeftClick = function (e) {
        if (tooltipsState.type !== 'default') {
            return;
        }
        var position = { x: e.pageX, y: e.pageY };
        var circleInfo = getCircleInfo(position);
        if (!circleInfo) {
            domain.command.draw({ position: position, diameter: 30 });
        }
    };
    var handleMouseMove = function (e) {
        if (tooltipsState.type !== 'default') {
            return;
        }
        var position = { x: e.pageX, y: e.pageY };
        var circleInfo = getCircleInfo(position);
        if (circleInfo) {
            domain.command.setSelectedIndex(circleInfo.index);
        }
        else {
            domain.command.setSelectedIndex(-1);
        }
    };
    var handleOpenSlider = function () {
        if (tooltipsState.type === 'show-tips') {
            domain.command.updateTooltips({
                type: 'open-slider',
                index: tooltipsState.index,
                circle: tooltipsState.circle,
                pageX: tooltipsState.pageX,
                pageY: tooltipsState.pageY,
            });
        }
    };
    var handleCloseSlider = function () {
        domain.command.updateTooltips({
            type: 'default',
        });
    };
    var handleAdust = function (event) {
        var value = parseInt(event.target.value, 10);
        if (selectedCircleInfo && !isNaN(value)) {
            domain.command.adjust({
                index: selectedCircleInfo.index,
                diameter: value,
            });
        }
    };
    return (react_1.default.createElement("div", { style: {
            border: '1px solid #eaeaea',
            boxSizing: 'border-box',
            padding: 10,
        } },
        react_1.default.createElement("h2", null, "Circle Drawer"),
        react_1.default.createElement("div", { style: {
                width: 400,
                textAlign: 'center',
                padding: 10,
            } },
            react_1.default.createElement("button", { onClick: function () { return domain.command.undo(); }, style: {
                    margin: '0 10px',
                }, disabled: !canUndo }, "Undo"),
            react_1.default.createElement("button", { onClick: function () { return domain.command.redo(); }, style: {
                    margin: '0 10px',
                }, disabled: !canRedo }, "Redo")),
        react_1.default.createElement("div", { style: {
                width: 400,
                height: 400,
                border: '1px solid #eaeaea',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }, onClick: handleLeftClick, onMouseMove: handleMouseMove }, drawState.circles.map(function (circle, index) {
            return (react_1.default.createElement("div", { key: circle.position.x +
                    '-' +
                    circle.position.y +
                    '-' +
                    circle.diameter, style: {
                    position: 'absolute',
                    left: circle.position.x - circle.diameter / 2,
                    top: circle.position.y - circle.diameter / 2,
                    width: circle.diameter,
                    height: circle.diameter,
                    borderRadius: circle.diameter / 2,
                    border: '1px solid #666',
                    backgroundColor: (selectedCircleInfo === null || selectedCircleInfo === void 0 ? void 0 : selectedCircleInfo.index) === index ? '#eaeaea' : '',
                }, onContextMenu: handleRightClick }));
        })),
        tooltipsState.type === 'show-tips' && (react_1.default.createElement(OuterClickWrapper_1.OuterClickWrapper, { style: {
                position: 'absolute',
                left: tooltipsState.pageX,
                top: tooltipsState.pageY,
                zIndex: 100,
                background: '#fff',
                border: '1px solid #666',
                padding: 10,
            }, onOuterClick: handleCloseSlider, onClick: handleOpenSlider }, "Adjust Diameter")),
        tooltipsState.type === 'open-slider' && (react_1.default.createElement(OuterClickWrapper_1.OuterClickWrapper, { style: {
                position: 'absolute',
                left: tooltipsState.pageX,
                top: tooltipsState.pageY,
                background: '#fff',
                border: '1px solid #666',
                zIndex: 100,
                padding: 10,
            }, onOuterClick: handleCloseSlider, onClick: handleOpenSlider },
            react_1.default.createElement("p", null, "Adjust Diameter"),
            react_1.default.createElement("div", null,
                react_1.default.createElement("input", { type: "range", value: (_a = selectedCircleInfo === null || selectedCircleInfo === void 0 ? void 0 : selectedCircleInfo.circle.diameter) !== null && _a !== void 0 ? _a : '', min: 1, max: 150, onChange: handleAdust }))))));
};
exports.CircleDrawerApp = CircleDrawerApp;
//# sourceMappingURL=CircleDrawer.js.map