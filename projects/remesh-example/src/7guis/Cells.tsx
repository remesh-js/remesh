import React from 'react'

import { Remesh, RemeshStateOptions } from 'remesh'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

type CellContent =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'formula'
      formula: string
    }

type CellState = {
  content: CellContent
  isEditing: boolean
}

export const Cells = Remesh.domain({
  name: 'Cells',
  impl: (domain) => {
    const RowKeyListState = domain.state({
      name: 'RowKeyListState',
      default: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(String),
    })

    const ColumnKeyListState = domain.state({
      name: 'ColumnKeyListState',
      default: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    })

    const CellState = domain.state({
      name: 'CellState',
      impl: (_: string): CellState => {
        return {
          content: {
            type: 'text',
            text: '',
          },
          isEditing: false,
        }
      },
    })

    const CellQuery = domain.query({
      name: 'CellQuery',
      impl: ({ get }, key: string) => {
        const state = get(CellState(key))

        if (state.content.type === 'text') {
          return {
            type: 'text' as const,
            isEditing: state.isEditing,
            content: state.content.text,
            displayContent: state.content.text,
          }
        }

        if (state.content.type === 'formula') {
          const evaluate = compile(state.content.formula)
          const getCellValue = (cellKey: string) => {
            return Number(get(CellQuery(cellKey)).displayContent)
          }

          return {
            type: 'formula' as const,
            isEditing: state.isEditing,
            content: state.content.formula,
            displayContent: evaluate(getCellValue),
          }
        }

        throw new Error('Unknown cell type')
      },
    })

    const selectCell = domain.command({
      name: 'selectCell',
      impl: ({ get }, key: string) => {
        const state = get(CellState(key))
        return CellState(key).new({
          content: state.content,
          isEditing: true,
        })
      },
    })

    const unselectCell = domain.command({
      name: 'unselectCell',
      impl: ({ get }, key: string) => {
        const state = get(CellState(key))
        return CellState(key).new({
          content: state.content,
          isEditing: false,
        })
      },
    })

    const setCellContent = domain.command({
      name: 'setCellContent',
      impl: ({ get }, { key, input }: { key: string; input: string }) => {
        const state = get(CellState(key))

        if (input.startsWith('=')) {
          return CellState(key).new({
            content: {
              type: 'formula',
              formula: input,
            },
            isEditing: state.isEditing,
          })
        }

        return CellState(key).new({
          content: {
            type: 'text',
            text: input,
          },
          isEditing: state.isEditing,
        })
      },
    })

    const testOptionalArg0 = domain.command({
      name: 'testOptionalArg0',
      impl: (_, arg?: number) => {
        return []
      },
    })

    testOptionalArg0()

    const testOptionalArg1 = domain.state({
      name: 'testOptionalArg1',
      impl: (arg?: number) => {
        return arg ?? 0
      },
    })

    testOptionalArg1()

    const testOptionalArg2 = domain.query({
      name: 'testOptionalArg2',
      impl: (_, arg: number = 0) => {
        return arg ?? 0
      }
    })

    testOptionalArg2()

    const testOptionalArg3 = domain.event({
      name: 'testOptionalArg3',
      impl: (_, arg: number = 0) => {
        return arg
      }
    })

    testOptionalArg3()

    const test4 = domain.event<number>({
      name: 'test4',
    })

    test4()

    return {
      query: {
        CellQuery,
        ColumnKeyListQuery: ColumnKeyListState.Query,
        RowKeyListQuery: RowKeyListState.Query,
      },
      command: {
        selectCell,
        unselectCell,
        setCellContent,
        testOptionalArg0
      },
    }
  },
})

export const CellsApp = () => {
  const cells = useRemeshDomain(Cells())
  const columnKeyList = useRemeshQuery(cells.query.ColumnKeyListQuery())
  const rowKeyList = useRemeshQuery(cells.query.RowKeyListQuery())

  cells.command.testOptionalArg0()

  return (
    <div>
      <h2>Cells</h2>
      <table
        style={{
          borderCollapse: 'collapse',
          border: '1px solid #bbb',
          textAlign: 'center',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#f6f6f6',
            }}
          >
            <th style={{ width: 30, display: 'block' }}></th>
            {columnKeyList.map((key) => (
              <th
                key={key}
                style={{
                  maxWidth: 80,
                  border: '1px solid #bbb',
                }}
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowKeyList.map((rowKey) => {
            return (
              <tr key={rowKey}>
                <RowView rowKey={rowKey} columnKeyList={columnKeyList} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type RowViewProps = {
  rowKey: string
  columnKeyList: string[]
}

const RowView = ({ columnKeyList, rowKey }: RowViewProps) => {
  const cells = useRemeshDomain(Cells())

  return (
    <>
      <td
        style={{
          width: 30,
          border: '1px solid #bbb',
          backgroundColor: '#f6f6f6',
        }}
      >
        {rowKey}
      </td>
      {columnKeyList.map((columnKey) => {
        const cellKey = `${columnKey}${rowKey}`
        return (
          <td
            key={cellKey}
            style={{
              maxWidth: 80,
              minWidth: 80,
              border: '1px solid #bbb',
              overflow: 'hidden',
            }}
            onClick={() => {
              cells.command.selectCell(cellKey)
            }}
          >
            <CellView cellKey={cellKey} />
          </td>
        )
      })}
    </>
  )
}

const CellView = ({ cellKey }: { cellKey: string }) => {
  const cells = useRemeshDomain(Cells())
  const cell = useRemeshQuery(cells.query.CellQuery(cellKey))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cells.command.setCellContent({ key: cellKey, input: e.target.value })
  }

  return (
    <>
      {cell.isEditing && (
        <input
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
          value={cell.content}
          onChange={handleChange}
          onBlur={() => {
            if (cell.isEditing) {
              cells.command.unselectCell(cellKey)
            }
          }}
          autoFocus
        />
      )}

      {!cell.isEditing && cell.displayContent}
    </>
  )
}

const compile = (formula: string) => {
  return (get: Function) => {
    try {
      const expression = formula.slice(1).replace(/\w\d+/g, (matched) => {
        return `get('${matched}')`
      })

      const fn = new Function('get', `return (${expression}).toString()`)

      return fn(get)
    } catch {
      return '-'
    }
  }
}
