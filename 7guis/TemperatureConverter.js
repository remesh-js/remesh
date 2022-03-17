"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemperatureConverterApp = void 0;
var react_1 = require("react");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
var TemperatureConverter = remesh_1.Remesh.domain({
    name: 'TemperatureConverter',
    impl: function (domain) {
        var CelsiusState = domain.state({
            name: 'CelsiusState',
            default: '',
        });
        var FahrenheitState = domain.state({
            name: 'FahrenheitState',
            default: '',
        });
        var resetBoth = domain.command({
            name: 'resetBoth',
            impl: function () {
                return [CelsiusState().new(''), FahrenheitState().new('')];
            },
        });
        var updateCelsius = domain.command({
            name: 'updateCelsius',
            impl: function (_a, input) {
                if (input === '') {
                    return resetBoth();
                }
                var celsius = parseFloat(input);
                if (Number.isNaN(celsius)) {
                    return CelsiusState().new(input);
                }
                var fahrenheit = celsius * (9 / 5) + 32;
                return [
                    CelsiusState().new(input),
                    FahrenheitState().new(fahrenheit.toString()),
                ];
            },
        });
        var updateFahrenheit = domain.command({
            name: 'updateFahrenheit',
            impl: function (_a, input) {
                if (input === '') {
                    return resetBoth();
                }
                var fahrenheit = parseFloat(input);
                if (Number.isNaN(fahrenheit)) {
                    return FahrenheitState().new(input);
                }
                var celsius = (fahrenheit - 32) * (5 / 9);
                return [
                    CelsiusState().new(celsius.toString()),
                    FahrenheitState().new(input),
                ];
            },
        });
        return {
            query: {
                CelsiusQuery: CelsiusState.Query,
                FahrenheitQuery: FahrenheitState.Query,
            },
            command: {
                updateCelsius: updateCelsius,
                updateFahrenheit: updateFahrenheit,
            },
        };
    },
});
var TemperatureConverterApp = function () {
    var temperatureConverter = (0, react_2.useRemeshDomain)(TemperatureConverter);
    var celsius = (0, react_2.useRemeshQuery)(temperatureConverter.query.CelsiusQuery());
    var fahrenheit = (0, react_2.useRemeshQuery)(temperatureConverter.query.FahrenheitQuery());
    var handleCelsius = function (event) {
        temperatureConverter.command.updateCelsius(event.target.value);
    };
    var handleFahrenheit = function (event) {
        temperatureConverter.command.updateFahrenheit(event.target.value);
    };
    return (react_1.default.createElement("div", { style: {
            border: '1px solid #eaeaea',
            boxSizing: 'border-box',
            padding: 10,
        } },
        react_1.default.createElement("h2", null, "Temperature Converter"),
        react_1.default.createElement("div", null,
            react_1.default.createElement("input", { type: "text", value: celsius, onChange: handleCelsius }),
            react_1.default.createElement("label", { htmlFor: "" }, "Celsius"),
            "=",
            react_1.default.createElement("input", { type: "text", value: fahrenheit, onChange: handleFahrenheit }),
            react_1.default.createElement("label", { htmlFor: "" }, "Fahrenheit"))));
};
exports.TemperatureConverterApp = TemperatureConverterApp;
//# sourceMappingURL=TemperatureConverter.js.map