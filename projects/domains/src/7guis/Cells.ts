import { Remesh } from 'remesh'

export type CellContent =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'formula'
      formula: string
    }

export type CellState = {
  content: CellContent
  isEditing: boolean
}

export const Cells = Remesh.domain({
  name: 'Cells',
  inspectable: false,
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

    const cell = domain.query({
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
            return Number(get(cell(cellKey)).displayContent)
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

    return {
      query: {
        cell: cell,
        columnKeyList: ColumnKeyListState.query,
        rowKeyList: RowKeyListState.query,
      },
      command: {
        selectCell,
        unselectCell,
        setCellContent,
      },
    }
  },
})

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
