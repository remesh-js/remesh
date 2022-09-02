import React from 'react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { CellsDomain, rows, columns } from 'remesh-domains-for-demos/dist/7guis/Cells'

export const CellsApp = () => {
  const cellsDomain = useRemeshDomain(CellsDomain())

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
            {columns.map((key) => (
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
          {rows.map((rowKey) => {
            return (
              <tr key={rowKey}>
                <RowView rowKey={rowKey} columnKeyList={columns} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type RowViewProps = {
  rowKey: number
  columnKeyList: string[]
}

const RowView = ({ columnKeyList, rowKey }: RowViewProps) => {
  const send = useRemeshSend()
  const cells = useRemeshDomain(CellsDomain())

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
              send(cells.command.SelectCellCommand(cellKey))
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
  const send = useRemeshSend()
  const cellsDomain = useRemeshDomain(CellsDomain())
  const cell = useRemeshQuery(cellsDomain.query.CellQuery(cellKey))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    send(cellsDomain.command.SetCellContentCommand({ key: cellKey, input: e.target.value }))
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
              send(cellsDomain.command.UnselectCellCommand(cellKey))
            }
          }}
          autoFocus
        />
      )}

      {!cell.isEditing && cell.displayContent}
    </>
  )
}
