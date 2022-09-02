import { Remesh } from 'remesh'

import { ListModule } from 'remesh/modules/list'

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
  row: number
  column: string
  content: CellContent
  isEditing: boolean
}

export const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const generateDefaultCellList = () => {
  const cellList = [] as CellState[]

  for (const column of columns) {
    for (const row of rows) {
      cellList.push({
        row,
        column,
        content: {
          type: 'text',
          text: '',
        },
        isEditing: false,
      })
    }
  }

  return cellList
}

export const CellsDomain = Remesh.domain({
  name: 'CellsDomain',
  inspectable: false,
  impl: (domain) => {
    const CellListModule = ListModule<CellState>(domain, {
      name: 'CellListModule',
      key: (cell) => cell.column + cell.row,
      default: generateDefaultCellList(),
    })

    const CellQuery = domain.query({
      name: 'CellQuery',
      impl: ({ get }, key: string) => {
        const state = get(CellListModule.query.ItemQuery(key))

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

    const SelectCellCommand = domain.command({
      name: 'SelectCellCommand',
      impl: ({ get }, key: string) => {
        const state = get(CellListModule.query.ItemQuery(key))

        return CellListModule.command.UpdateItemCommand({
          ...state,
          isEditing: true,
        })
      },
    })

    const UnselectCellCommand = domain.command({
      name: 'UnselectCellCommand',
      impl: ({ get }, key: string) => {
        const state = get(CellListModule.query.ItemQuery(key))

        return CellListModule.command.UpdateItemCommand({
          ...state,
          isEditing: false,
        })
      },
    })

    const SetCellContentCommand = domain.command({
      name: 'SetCellContentCommand',
      impl: ({ get }, { key, input }: { key: string; input: string }) => {
        const state = get(CellListModule.query.ItemQuery(key))

        if (input.startsWith('=')) {
          return CellListModule.command.UpdateItemCommand({
            ...state,
            content: {
              type: 'formula',
              formula: input,
            },
            isEditing: state.isEditing,
          })
        } else {
          return CellListModule.command.UpdateItemCommand({
            ...state,
            content: {
              type: 'text',
              text: input,
            },
            isEditing: state.isEditing,
          })
        }
      },
    })

    return {
      query: {
        CellQuery,
      },
      command: {
        SelectCellCommand,
        UnselectCellCommand,
        SetCellContentCommand,
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
