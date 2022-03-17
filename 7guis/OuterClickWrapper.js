"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OuterClickWrapper = void 0;
var react_1 = require("react");
var OuterClickWrapper = function (props) {
    var onOuterClick = props.onOuterClick, restProps = __rest(props, ["onOuterClick"]);
    var containerRef = react_1.default.useRef(null);
    (0, react_1.useEffect)(function () {
        var handleClick = function (event) {
            if (containerRef.current &&
                !containerRef.current.contains(event.target)) {
                onOuterClick === null || onOuterClick === void 0 ? void 0 : onOuterClick(event);
            }
        };
        document.addEventListener('click', handleClick);
        return function () {
            document.removeEventListener('click', handleClick);
        };
    }, []);
    return react_1.default.createElement("div", __assign({ ref: containerRef }, restProps));
};
exports.OuterClickWrapper = OuterClickWrapper;
//# sourceMappingURL=OuterClickWrapper.js.map