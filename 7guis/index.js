"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_dom_1 = require("react-dom");
var react_2 = require("../remesh/react");
var Counter_1 = require("./Counter");
var TemperatureConverter_1 = require("./TemperatureConverter");
var FlightBooker_1 = require("./FlightBooker");
var Timer_1 = require("./Timer");
var CRUD_1 = require("./CRUD");
var CircleDrawer_1 = require("./CircleDrawer");
var Cells_1 = require("./Cells");
var Root = function () {
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h1", null, "7GUIs in React/Remesh/TypeScript"),
        react_1.default.createElement("p", null, "This is a live version of an implementation (source) of 7GUIs with React, TypeScript and Remesh."),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(Counter_1.CounterApp, null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(TemperatureConverter_1.TemperatureConverterApp, null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(FlightBooker_1.FlightBookerApp, null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(Timer_1.TimerApp, null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(CRUD_1.CRUDApp, null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(CircleDrawer_1.CircleDrawerApp, null),
        react_1.default.createElement("hr", null),
        react_1.default.createElement(Cells_1.CellsApp, null)));
};
react_dom_1.default.render(react_1.default.createElement(react_1.default.StrictMode, null,
    react_1.default.createElement(react_2.RemeshRoot, null,
        react_1.default.createElement(Root, null))), document.getElementById('root'));
//# sourceMappingURL=index.js.map