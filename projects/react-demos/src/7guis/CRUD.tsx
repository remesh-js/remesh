import React from 'react'

import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { CRUDDomain } from 'remesh-domains-for-demos/dist/7guis/CRUD'

import { OuterClickWrapper } from './OuterClickWrapper'

export const CRUDApp = () => {
  const domain = useRemeshDomain(CRUDDomain())
  const filteredList = useRemeshQuery(domain.query.FilteredListQuery())
  const filter = useRemeshQuery(domain.query.FilterPrefixQuery())
  const created = useRemeshQuery(domain.query.CreatedQuery())
  const selected = useRemeshQuery(domain.query.SelectedQuery())

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    domain.command.UpdateFilterPrefixCommand(e.target.value)
  }

  const handleSelect = (itemId: string | null) => {
    domain.command.SelectItemCommand(itemId)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selected) {
      domain.command.UpdateSelectedNameCommand({
        name: e.target.value,
      })
    } else {
      domain.command.UpdateCreatedCommand({ name: e.target.value })
    }
  }

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selected) {
      domain.command.UpdateSelectedNameCommand({
        surname: e.target.value,
      })
    } else {
      domain.command.UpdateCreatedCommand({ surname: e.target.value })
    }
  }

  const handleCreate = () => {
    if (selected === null) {
      domain.command.CreateNameItemCommand()
    }
  }

  const handleSync = () => {
    if (selected) {
      domain.command.SyncSelectedCommand()
    }
  }

  const handleDelete = () => {
    if (selected) {
      domain.command.DeleteItemCommand(selected.id)
      domain.command.SelectItemCommand(null)
    }
  }

  return (
    <OuterClickWrapper
      style={{
        width: 400,
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
      onOuterClick={() => {
        handleSelect(null)
      }}
    >
      <h2>CRUD</h2>
      <div>
        <label htmlFor="">Filter prefix</label>
        <input type="text" value={filter} onChange={handleFilterChange} />
      </div>
      <div
        style={{
          display: 'flex',
        }}
      >
        <div
          style={{
            width: '50%',
            height: 100,
            border: '1px solid #eaeaea',
            overflow: 'scroll',
          }}
        >
          {filteredList.map((item) => {
            const fullName = item.name + ', ' + item.surname

            return (
              <div
                key={item.id}
                style={{
                  background: selected?.id === item.id ? 'blue' : '',
                  color: selected?.id === item.id ? 'white' : '',
                }}
                onClick={() => {
                  handleSelect(item.id)
                }}
              >
                {fullName}
              </div>
            )
          })}
        </div>
        <div style={{ width: '50%', padding: 10 }}>
          <div>
            <label>Name:</label>
            <input type="text" value={selected ? selected.name : created.name} onChange={handleNameChange} />
          </div>
          <div>
            <label>Surname:</label>
            <input type="text" value={selected ? selected.surname : created.surname} onChange={handleSurnameChange} />
          </div>
        </div>

        <div>
          <button disabled={selected !== null} style={{ marginRight: 10 }} onClick={handleCreate}>
            Create
          </button>
          <button disabled={selected === null} style={{ marginRight: 10 }} onClick={handleSync}>
            Update
          </button>
          <button disabled={selected === null} style={{ marginRight: 10 }} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </OuterClickWrapper>
  )
}
