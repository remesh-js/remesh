"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellsApp = exports.Cells = void 0;
var react_1 = require("react");
var remesh_1 = require("../remesh");
var react_2 = require("../remesh/react");
exports.Cells = remesh_1.Remesh.domain({
    name: 'Cells',
    impl: function (domain) {
        var RowKeyListState = domain.state({
            name: 'RowKeyListState',
            default: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(String),
        });
        var ColumnKeyListState = domain.state({
            name: 'ColumnKeyListState',
            default: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
        });
        var CellState = domain.state({
            name: 'CellState',
            impl: function () {
                return {
                    content: {
                        type: 'text',
                        text: '',
                    },
                    isEditing: false,
                };
            },
        });
        var CellQuery = domain.query({
            name: 'CellQuery',
            impl: function (_a, key) {
                var get = _a.get;
                var state = get(CellState(key));
                if (state.content.type === 'text') {
                    return {
                        type: 'text',
                        isEditing: state.isEditing,
                        content: state.content.text,
                        displayContent: state.content.text,
                    };
                }
                if (state.content.type === 'formula') {
                    var evaluate = compile(state.content.formula);
                    var getCellValue = function (cellKey) {
                        return Number(get(CellQuery(cellKey)).displayContent);
                    };
                    return {
                        type: 'formula',
                        isEditing: state.isEditing,
                        content: state.content.formula,
                        displayContent: evaluate(getCellValue),
                    };
                }
                throw new Error('Unknown cell type');
            },
        });
        var selectCell = domain.command({
            name: 'selectCell',
            impl: function (_a, key) {
                var get = _a.get;
                var state = get(CellState(key));
                return CellState(key).new({
                    content: state.content,
                    isEditing: true,
                });
            },
        });
        var unselectCell = domain.command({
            name: 'unselectCell',
            impl: function (_a, key) {
                var get = _a.get;
                var state = get(CellState(key));
                return CellState(key).new({
                    content: state.content,
                    isEditing: false,
                });
            },
        });
        var setCellContent = domain.command({
            name: 'setCellContent',
            impl: function (_a, _b) {
                var get = _a.get;
                var key = _b.key, input = _b.input;
                var state = get(CellState(key));
                if (input.startsWith('=')) {
                    return CellState(key).new({
                        content: {
                            type: 'formula',
                            formula: input,
                        },
                        isEditing: state.isEditing,
                    });
                }
                return CellState(key).new({
                    content: {
                        type: 'text',
                        text: input,
                    },
                    isEditing: state.isEditing,
                });
            },
        });
        return {
            query: {
                CellQuery: CellQuery,
                ColumnKeyListQuery: ColumnKeyListState.Query,
                RowKeyListQuery: RowKeyListState.Query,
            },
            command: {
                selectCell: selectCell,
                unselectCell: unselectCell,
                setCellContent: setCellContent,
            },
        };
    },
});
var CellsApp = function () {
    var cells = (0, react_2.useRemeshDomain)(exports.Cells);
    var columnKeyList = (0, react_2.useRemeshQuery)(cells.query.ColumnKeyListQuery());
    var rowKeyList = (0, react_2.useRemeshQuery)(cells.query.RowKeyListQuery());
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "Cells"),
        react_1.default.createElement("table", { style: {
                borderCollapse: 'collapse',
                border: '1px solid #bbb',
                textAlign: 'center',
            } },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", { style: {
                        backgroundColor: '#f6f6f6',
                    } },
                    react_1.default.createElement("th", { style: { width: 30, display: 'block' } }),
                    columnKeyList.map(function (key) { return (react_1.default.createElement("th", { key: key, style: {
                            maxWidth: 80,
                            border: '1px solid #bbb',
                        } }, key)); }))),
            react_1.default.createElement("tbody", null, rowKeyList.map(function (rowKey) {
                return (react_1.default.createElement("tr", { key: rowKey },
                    react_1.default.createElement(RowView, { rowKey: rowKey, columnKeyList: columnKeyList })));
            })))));
};
exports.CellsApp = CellsApp;
var RowView = function (_a) {
    var columnKeyList = _a.columnKeyList, rowKey = _a.rowKey;
    var cells = (0, react_2.useRemeshDomain)(exports.Cells);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("td", { style: {
                width: 30,
                border: '1px solid #bbb',
                backgroundColor: '#f6f6f6',
            } }, rowKey),
        columnKeyList.map(function (columnKey) {
            var cellKey = "" + columnKey + rowKey;
            return (react_1.default.createElement("td", { key: cellKey, style: {
                    maxWidth: 80,
                    minWidth: 80,
                    border: '1px solid #bbb',
                    overflow: 'hidden',
                }, onClick: function () {
                    cells.command.selectCell(cellKey);
                } },
                react_1.default.createElement(CellView, { cellKey: cellKey })));
        })));
};
var CellView = function (_a) {
    var cellKey = _a.cellKey;
    var cells = (0, react_2.useRemeshDomain)(exports.Cells);
    var cell = (0, react_2.useRemeshQuery)(cells.query.CellQuery(cellKey));
    var handleChange = function (e) {
        cells.command.setCellContent({ key: cellKey, input: e.target.value });
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        cell.isEditing && (react_1.default.createElement("input", { style: {
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                boxSizing: 'border-box',
                textAlign: 'center',
            }, value: cell.content, onChange: handleChange, onBlur: function () {
                if (cell.isEditing) {
                    cells.command.unselectCell(cellKey);
                }
            }, autoFocus: true })),
        !cell.isEditing && cell.displayContent));
};
var compile = function (formula) {
    return function (get) {
        try {
            var expression = formula.slice(1).replace(/\w\d+/g, function (matched) {
                return "get('" + matched + "')";
            });
            var fn = new Function('get', "return (" + expression + ").toString()");
            return fn(get);
        }
        catch (_a) {
            return '-';
        }
    };
};
//# sourceMappingURL=Cells.js.map