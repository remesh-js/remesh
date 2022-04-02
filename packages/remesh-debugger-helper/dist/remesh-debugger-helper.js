"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemeshDebuggerHelper = exports.formatNow = exports.formatTime = void 0;
var tslib_1 = require("tslib");
var formatTime = function (time) {
    var hours = time.getHours().toString().padStart(2, '0');
    var minutes = time.getMinutes().toString().padStart(2, '0');
    var seconds = time.getSeconds().toString().padStart(2, '0');
    var milliseconds = time.getMilliseconds().toString().padStart(3, '0');
    return "".concat(hours, ":").concat(minutes, ":").concat(seconds, ".").concat(milliseconds);
};
exports.formatTime = formatTime;
var formatNow = function () {
    var time = new Date();
    return (0, exports.formatTime)(time);
};
exports.formatNow = formatNow;
var RemeshDebuggerHelper = function (options) {
    var config = tslib_1.__assign({ include: ['state', 'domain', 'event', 'command', 'command$'] }, options);
    var onActive = function (source, fn) {
        var _a;
        if ((_a = config.exclude) === null || _a === void 0 ? void 0 : _a.includes(source)) {
            return;
        }
        if (config.include) {
            if (config.include.includes(source)) {
                fn();
            }
        }
        else {
            fn();
        }
    };
    return {
        onActive: onActive,
    };
};
exports.RemeshDebuggerHelper = RemeshDebuggerHelper;
//# sourceMappingURL=remesh-debugger-helper.js.map