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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRUDApp = exports.CRUD = void 0;
var react_1 = require("react");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
var list_1 = require("../remesh/modules/list");
var OuterClickWrapper_1 = require("./OuterClickWrapper");
exports.CRUD = remesh_1.Remesh.domain({
    name: 'CRUD',
    impl: function (domain) {
        var nameUid = 0;
        var nameListDomain = domain.module((0, list_1.ListModule)({
            name: 'Name',
            getKey: function (item) { return item.id; },
            createItem: function (key) {
                return {
                    id: key,
                    name: '',
                    surname: '',
                };
            },
        }));
        var FilterPrefixState = domain.state({
            name: 'FilterPrefix',
            default: '',
        });
        var updateFilterPrefix = domain.command({
            name: 'updateFilterPrefix',
            impl: function (_a, prefix) {
                return FilterPrefixState().new(prefix);
            },
        });
        var CreatedState = domain.state({
            name: 'Created',
            default: {
                name: '',
                surname: '',
            },
        });
        var updateCreated = domain.command({
            name: 'UpdateCreated',
            impl: function (_a, name) {
                var get = _a.get;
                var currentName = get(CreatedState());
                return CreatedState().new(__assign(__assign({}, currentName), name));
            },
        });
        var SelectedState = domain.state({
            name: 'Selected',
            default: null,
        });
        var selectItem = domain.command({
            name: 'Select',
            impl: function (_a, itemId) {
                var get = _a.get;
                if (itemId === null) {
                    return SelectedState().new(null);
                }
                var targetItem = get(nameListDomain.query.ItemQuery(itemId));
                return SelectedState().new(targetItem);
            },
        });
        var updateSelectedName = domain.command({
            name: 'UpdateSelectedName',
            impl: function (_a, name) {
                var get = _a.get;
                var selected = get(SelectedState());
                if (selected === null) {
                    return [];
                }
                return SelectedState().new(__assign(__assign({}, selected), name));
            },
        });
        var FilteredListQuery = domain.query({
            name: 'FilteredListQuery',
            impl: function (_a) {
                var get = _a.get;
                var filterPrefix = get(FilterPrefixState());
                var nameList = get(nameListDomain.query.ItemListQuery());
                if (filterPrefix === '') {
                    return nameList;
                }
                return nameList.filter(function (item) { return item.surname.startsWith(filterPrefix); });
            },
        });
        var syncSelected = domain.command({
            name: 'SyncSelected',
            impl: function (_a) {
                var get = _a.get;
                var selected = get(SelectedState());
                if (selected === null) {
                    return [];
                }
                return nameListDomain.command.updateItem(selected);
            },
        });
        var createNameItem = domain.command({
            name: 'CreateNameItem',
            impl: function (_a) {
                var get = _a.get;
                var created = get(CreatedState());
                var newItem = __assign({ id: "" + nameUid++ }, created);
                return [
                    nameListDomain.command.addItem(newItem),
                    updateCreated({ name: '', surname: '' }),
                ];
            },
        });
        return {
            query: __assign(__assign({}, nameListDomain.query), { FilteredListQuery: FilteredListQuery, SelectedQuery: SelectedState.Query, FilterPrefixQuery: FilterPrefixState.Query, CreatedQuery: CreatedState.Query }),
            command: __assign(__assign({}, nameListDomain.command), { updateFilterPrefix: updateFilterPrefix, selectItem: selectItem, updateCreated: updateCreated, updateSelectedName: updateSelectedName, createNameItem: createNameItem, syncSelected: syncSelected }),
        };
    },
});
var CRUDApp = function () {
    var domain = (0, react_2.useRemeshDomain)(exports.CRUD);
    var filteredList = (0, react_2.useRemeshQuery)(domain.query.FilteredListQuery());
    var filter = (0, react_2.useRemeshQuery)(domain.query.FilterPrefixQuery());
    var created = (0, react_2.useRemeshQuery)(domain.query.CreatedQuery());
    var selected = (0, react_2.useRemeshQuery)(domain.query.SelectedQuery());
    var handleFilterChange = function (e) {
        domain.command.updateFilterPrefix(e.target.value);
    };
    var handleSelect = function (itemId) {
        domain.command.selectItem(itemId);
    };
    var handleNameChange = function (e) {
        if (selected) {
            domain.command.updateSelectedName({
                name: e.target.value,
            });
        }
        else {
            domain.command.updateCreated({ name: e.target.value });
        }
    };
    var handleSurnameChange = function (e) {
        if (selected) {
            domain.command.updateSelectedName({
                surname: e.target.value,
            });
        }
        else {
            domain.command.updateCreated({ surname: e.target.value });
        }
    };
    var handleCreate = function () {
        if (selected === null) {
            domain.command.createNameItem();
        }
    };
    var handleSync = function () {
        if (selected) {
            domain.command.syncSelected();
        }
    };
    var handleDelete = function () {
        if (selected) {
            domain.command.removeItem(selected.id);
            domain.command.selectItem(null);
        }
    };
    return (react_1.default.createElement(OuterClickWrapper_1.OuterClickWrapper, { style: {
            width: 400,
            border: '1px solid #eaeaea',
            boxSizing: 'border-box',
            padding: 10,
        }, onOuterClick: function () {
            handleSelect(null);
        } },
        react_1.default.createElement("div", null,
            react_1.default.createElement("label", { htmlFor: "" }, "Filter prefix"),
            react_1.default.createElement("input", { type: "text", value: filter, onChange: handleFilterChange })),
        react_1.default.createElement("div", { style: {
                display: 'flex',
            } },
            react_1.default.createElement("div", { style: {
                    width: '50%',
                    height: 100,
                    border: '1px solid #eaeaea',
                    overflow: 'scroll',
                } }, filteredList.map(function (item) {
                var fullName = item.name + ', ' + item.surname;
                return (react_1.default.createElement("div", { key: item.id, style: {
                        background: (selected === null || selected === void 0 ? void 0 : selected.id) === item.id ? 'blue' : '',
                        color: (selected === null || selected === void 0 ? void 0 : selected.id) === item.id ? 'white' : '',
                    }, onClick: function () {
                        handleSelect(item.id);
                    } }, fullName));
            })),
            react_1.default.createElement("div", { style: { width: '50%', padding: 10 } },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", null, "Name:"),
                    react_1.default.createElement("input", { type: "text", value: selected ? selected.name : created.name, onChange: handleNameChange })),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("label", null, "Surname:"),
                    react_1.default.createElement("input", { type: "text", value: selected ? selected.surname : created.surname, onChange: handleSurnameChange }))),
            react_1.default.createElement("div", null,
                react_1.default.createElement("button", { disabled: selected !== null, style: { marginRight: 10 }, onClick: handleCreate }, "Create"),
                react_1.default.createElement("button", { disabled: selected === null, style: { marginRight: 10 }, onClick: handleSync }, "Update"),
                react_1.default.createElement("button", { disabled: selected === null, style: { marginRight: 10 }, onClick: handleDelete }, "Delete")))));
};
exports.CRUDApp = CRUDApp;
//# sourceMappingURL=CRUD.js.map