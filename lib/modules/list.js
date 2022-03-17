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
exports.ListModule = void 0;
var index_1 = require("../index");
var ListModule = function (options) {
    return index_1.Remesh.module(function (domain) {
        var KeyListState = domain.state({
            name: options.name + ".KeyListState",
            default: [],
        });
        var ItemState = domain.state({
            name: options.name + ".ItemState",
            impl: function (key) {
                return options.createItem(key);
            },
        });
        var ItemListQuery = domain.query({
            name: options.name + ".ItemListQuery",
            impl: function (_a) {
                var get = _a.get;
                return get(KeyListState()).map(function (key) { return get(ItemState(key)); });
            },
        });
        var setList = domain.command({
            name: options.name + ".setList",
            impl: function (_a, list) {
                var keyList = list.map(options.getKey);
                return __spreadArray([
                    KeyListState().new(keyList)
                ], __read(list.map(function (item) { return ItemState(options.getKey(item)).new(item); })), false);
            },
        });
        var addItem = domain.command({
            name: options.name + ".addItem",
            impl: function (_a, newItem) {
                var get = _a.get;
                var keyList = get(KeyListState());
                var newKey = options.getKey(newItem);
                if (keyList.includes(newKey)) {
                    return [];
                }
                return [
                    KeyListState().new(keyList.concat(newKey)),
                    ItemState(newKey).new(newItem),
                ];
            },
        });
        var removeItem = domain.command({
            name: options.name + ".removeItem",
            impl: function (_a, targetKey) {
                var get = _a.get;
                var keyList = get(KeyListState());
                var newKeyList = keyList.filter(function (key) { return key !== targetKey; });
                return KeyListState().new(newKeyList);
            },
        });
        var updateItem = domain.command({
            name: options.name + ".updateItem",
            impl: function (_a, newItem) {
                var get = _a.get;
                var key = options.getKey(newItem);
                var keyList = get(KeyListState());
                if (!keyList.includes(key)) {
                    return addItem(newItem);
                }
                return ItemState(key).new(newItem);
            },
        });
        return {
            command: {
                setList: setList,
                addItem: addItem,
                removeItem: removeItem,
                updateItem: updateItem,
            },
            query: {
                KeyListQuery: KeyListState.Query,
                ItemQuery: ItemState.Query,
                ItemListQuery: ItemListQuery,
            },
        };
    });
};
exports.ListModule = ListModule;
//# sourceMappingURL=list.js.map