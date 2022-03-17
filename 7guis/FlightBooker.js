"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightBookerApp = void 0;
var react_1 = require("react");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
var getDate = function (dateInput) {
    var list = dateInput.split('.');
    if (list.length !== 3) {
        return null;
    }
    var date = new Date(list[2] + "." + list[1] + "." + list[0]);
    if (date.toString() === 'Invalid Date') {
        return null;
    }
    return date;
};
var toDateInput = function (date) {
    var list = date.toLocaleDateString().split('/');
    return list[2] + "." + list[1] + "." + list[0];
};
var compareDate = function (date1, date2) {
    if (date1.getFullYear() !== date2.getFullYear()) {
        return date1.getFullYear() - date2.getFullYear();
    }
    if (date1.getMonth() !== date2.getMonth()) {
        return date1.getMonth() - date2.getMonth();
    }
    return date1.getDate() - date2.getDate();
};
var FlightBooker = remesh_1.Remesh.domain({
    name: 'FlightBooker',
    impl: function (domain) {
        var OptionState = domain.state({
            name: 'OptionState',
            default: 'one-way',
        });
        var StartDateInputState = domain.state({
            name: 'StartDateInputState',
            default: toDateInput(new Date()),
        });
        var EndDateInputState = domain.state({
            name: 'EndDateInputState',
            default: toDateInput(new Date()),
        });
        var StartDateQuery = domain.query({
            name: 'StartDateQuery',
            impl: function (_a) {
                var get = _a.get;
                var startDateInput = get(StartDateInputState());
                return getDate(startDateInput);
            },
        });
        var EndDateQuery = domain.query({
            name: 'EndDateQuery',
            impl: function (_a) {
                var get = _a.get;
                var endDateInput = get(EndDateInputState());
                return getDate(endDateInput);
            },
        });
        var updateOption = domain.command({
            name: 'updateOption',
            impl: function (_a, option) {
                return OptionState().new(option);
            },
        });
        var updateStartDate = domain.command({
            name: 'updateStartDate',
            impl: function (_a, dateInput) {
                return StartDateInputState().new(dateInput);
            },
        });
        var updateEndDate = domain.command({
            name: 'updateEndDate',
            impl: function (_a, dateInput) {
                return EndDateInputState().new(dateInput);
            },
        });
        var StatusQuery = domain.query({
            name: 'StatusQuery',
            impl: function (_a) {
                var get = _a.get;
                var option = get(OptionState());
                var startDate = get(StartDateQuery());
                var endDate = get(EndDateQuery());
                var startDateStatus = !!startDate ? 'valid' : 'invalid';
                var endDateStatus = option === 'return' ? (!!endDate ? 'valid' : 'invalid') : 'disabled';
                var bookButtonStatus = option === 'one-way'
                    ? !!startDate
                        ? 'enabled'
                        : 'disabled'
                    : !!startDate && !!endDate && compareDate(startDate, endDate) <= 0
                        ? 'enabled'
                        : 'disabled';
                return {
                    startDate: startDateStatus,
                    endDate: endDateStatus,
                    bookButton: bookButtonStatus,
                };
            },
        });
        return {
            query: {
                StatusQuery: StatusQuery,
                OptionQuery: OptionState.Query,
                StartDateQuery: StartDateQuery,
                EndDateQuery: EndDateQuery,
                StartDateInput: StartDateInputState.Query,
                EndDateInput: EndDateInputState.Query,
            },
            command: {
                updateOption: updateOption,
                updateStartDate: updateStartDate,
                updateEndDate: updateEndDate,
            },
        };
    },
});
var FlightBookerApp = function () {
    var flightBooker = (0, react_2.useRemeshDomain)(FlightBooker);
    var emit = (0, react_2.useRemeshEmit)();
    var option = (0, react_2.useRemeshQuery)(flightBooker.query.OptionQuery());
    var startDate = (0, react_2.useRemeshQuery)(flightBooker.query.StartDateQuery());
    var endDate = (0, react_2.useRemeshQuery)(flightBooker.query.EndDateQuery());
    var status = (0, react_2.useRemeshQuery)(flightBooker.query.StatusQuery());
    var startDateInput = (0, react_2.useRemeshQuery)(flightBooker.query.StartDateInput());
    var endDateInput = (0, react_2.useRemeshQuery)(flightBooker.query.EndDateInput());
    var handleOptionChange = function (event) {
        flightBooker.command.updateOption(event.target.value);
    };
    var handleStartDateChange = function (event) {
        flightBooker.command.updateStartDate(event.target.value);
    };
    var handleEndDateChange = function (event) {
        flightBooker.command.updateEndDate(event.target.value);
    };
    var handleBookButtonClick = function () {
        if (status.bookButton === 'enabled') {
            if (option === 'one-way') {
                alert("You have booked a one-way flight on " + startDateInput);
            }
            else {
                alert("You have booked return flight from " + startDateInput + " to " + endDateInput);
            }
        }
    };
    return (react_1.default.createElement("div", { style: {
            width: 400,
            border: '1px solid #eaeaea',
            boxSizing: 'border-box',
            padding: 10,
        } },
        react_1.default.createElement("h2", null, "Flight Booker"),
        react_1.default.createElement("div", null,
            react_1.default.createElement("select", { value: option, onChange: handleOptionChange },
                react_1.default.createElement("option", { value: "one-way" }, "One-way flight"),
                react_1.default.createElement("option", { value: "return" }, "Return flight"))),
        react_1.default.createElement("div", null,
            react_1.default.createElement("input", { type: "text", style: {
                    backgroundColor: status.startDate === 'invalid' ? 'red' : '',
                }, value: startDateInput, onChange: handleStartDateChange })),
        react_1.default.createElement("div", null,
            react_1.default.createElement("input", { type: "text", style: {
                    backgroundColor: status.endDate === 'invalid' ? 'red' : '',
                }, disabled: status.endDate === 'disabled', value: endDateInput, onChange: handleEndDateChange })),
        react_1.default.createElement("div", null,
            react_1.default.createElement("button", { disabled: status.bookButton === 'disabled', onClick: handleBookButtonClick }, "Book"))));
};
exports.FlightBookerApp = FlightBookerApp;
//# sourceMappingURL=FlightBooker.js.map