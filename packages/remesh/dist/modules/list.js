"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListModule = void 0;
var ListModule = function (domain, options) {
    var KeyListState = domain.state({
        name: "".concat(options.name, ".KeyListState"),
        default: [],
    });
    var ItemState = domain.state({
        name: "".concat(options.name, ".ItemState"),
    });
    var ItemListQuery = domain.query({
        name: "".concat(options.name, ".ItemListQuery"),
        impl: function (_a) {
            var get = _a.get;
            return get(KeyListState()).map(function (key) { return get(ItemState(key)); });
        },
    });
    var ListChangedEvent = domain.event({
        name: "".concat(options.name, ".ListChangedEvent"),
    });
    var ItemAddedEvent = domain.event({
        name: "".concat(options.name, ".ItemAddedEvent"),
    });
    var FailedToAddItemEvent = domain.event({
        name: "".concat(options.name, ".FailedToAddItemEvent"),
    });
    var ItemUpdatedEvent = domain.event({
        name: "".concat(options.name, ".ItemUpdatedEvent"),
    });
    var FailedToUpdateItemEvent = domain.event({
        name: "".concat(options.name, ".FailedToUpdateItemEvent"),
    });
    var ItemDeletedEvent = domain.event({
        name: "".concat(options.name, ".ItemDeletedEvent"),
    });
    var setList = domain.command({
        name: "".concat(options.name, ".setList"),
        impl: function (_a, newList) {
            var get = _a.get;
            var keyList = newList.map(options.key);
            var oldList = get(ItemListQuery());
            return [
                newList.map(function (item, index) { return ItemState(keyList[index]).new(item); }),
                KeyListState().new(keyList),
                ListChangedEvent({ previous: oldList, current: newList }),
            ];
        },
    });
    var addItem = domain.command({
        name: "".concat(options.name, ".addItem"),
        impl: function (_a, newItem) {
            var get = _a.get;
            var keyList = get(KeyListState());
            var list = get(ItemListQuery());
            var newKey = options.key(newItem);
            if (keyList.includes(newKey)) {
                return FailedToAddItemEvent({
                    reason: 'item already exists',
                });
            }
            return [setList(list.concat(newItem)), ItemAddedEvent({ item: newItem })];
        },
    });
    var deleteItem = domain.command({
        name: "".concat(options.name, ".deleteItem"),
        impl: function (_a, targetKey) {
            var get = _a.get;
            var list = get(ItemListQuery());
            var newList = list.filter(function (item) { return options.key(item) !== targetKey; });
            var removedItem = get(ItemState(targetKey));
            return [setList(newList), ItemDeletedEvent({ item: removedItem })];
        },
    });
    var updateItem = domain.command({
        name: "".concat(options.name, ".updateItem"),
        impl: function (_a, newItem) {
            var get = _a.get;
            var key = options.key(newItem);
            var keyList = get(KeyListState());
            if (!keyList.includes(key)) {
                return FailedToUpdateItemEvent({
                    item: newItem,
                    reason: 'item does not exist',
                });
            }
            var list = get(ItemListQuery());
            var newList = list.map(function (item) {
                if (options.key(item) === key) {
                    return newItem;
                }
                return item;
            });
            var oldItem = get(ItemState(key));
            return [setList(newList), ItemUpdatedEvent({ previous: oldItem, current: newItem })];
        },
    });
    return {
        command: {
            setList: setList,
            addItem: addItem,
            deleteItem: deleteItem,
            updateItem: updateItem,
        },
        query: {
            KeyListQuery: KeyListState.Query,
            ItemQuery: ItemState.Query,
            ItemListQuery: ItemListQuery,
        },
        event: {
            ListChangedEvent: ListChangedEvent,
            ItemAddedEvent: ItemAddedEvent,
            FailedToAddItemEvent: FailedToAddItemEvent,
            ItemUpdatedEvent: ItemUpdatedEvent,
            FailedToUpdateItemEvent: FailedToUpdateItemEvent,
            ItemDeletedEvent: ItemDeletedEvent,
        },
    };
};
exports.ListModule = ListModule;
//# sourceMappingURL=list.js.map