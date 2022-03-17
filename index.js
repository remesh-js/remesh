"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Remesh = void 0;
var remesh_1 = require("./remesh");
var store_1 = require("./store");
__exportStar(require("./remesh"), exports);
exports.Remesh = {
    domain: remesh_1.RemeshDomain,
    module: remesh_1.RemeshModule,
    extern: remesh_1.RemeshExtern,
    store: store_1.RemeshStore,
};
//# sourceMappingURL=index.js.map