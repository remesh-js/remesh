import React from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { Cells } from 'remesh-domains-for-demos/dist/7guis/Cells'

export const CellsApp = () => {
  const cells = useRemeshDomain(Cells())
  const columnKeyList = useRemeshQuery(cells.query.columnKeyList())
  const rowKeyList = useRemeshQuery(cells.query.rowKeyList())

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
            onClick={(event) => {
              if (event.target instanceof HTMLInputElement) {
                return
              }
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
  const cell = useRemeshQuery(cells.query.cell(cellKey))

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