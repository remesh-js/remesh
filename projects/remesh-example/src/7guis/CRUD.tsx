import React from 'react'

import { Remesh } from 'remesh'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { ListModule } from 'remesh/modules/list'
import { OuterClickWrapper } from './OuterClickWrapper'

type Name = {
  name: string
  surname: string
}

type NameItem = {
  id: string
} & Name

export const CRUD = Remesh.domain({
  name: 'CRUD',
  impl: (domain) => {
    let nameUid = 0

    const nameListDomain = ListModule<NameItem>(domain, {
      name: 'Name',
      key: (item) => item.id,
    })

    const FilterPrefixState = domain.state({
      name: 'FilterPrefix',
      default: '',
    })

    const updateFilterPrefix = domain.command({
      name: 'updateFilterPrefix',
      impl: ({}, prefix: string) => {
        return FilterPrefixState().new(prefix)
      },
    })

    const CreatedState = domain.state<Name>({
      name: 'Created',
      default: {
        name: '',
        surname: '',
      },
    })

    const updateCreated = domain.command({
      name: 'UpdateCreated',
      impl: ({ get }, name: Partial<Name>) => {
        const currentName = get(CreatedState())
        return CreatedState().new({
          ...currentName,
          ...name,
        })
      },
    })

    const SelectedState = domain.state<NameItem | null>({
      name: 'Selected',
      default: null,
    })

    const selectItem = domain.command({
      name: 'Select',
      impl: ({ get }, targetItemId: string | null) => {
        const currentSelected = get(SelectedState())

        if (targetItemId === null) {
          if (currentSelected === null) {
            return null
          } else {
            return SelectedState().new(null)
          }
        }

        if (currentSelected && currentSelected.id === targetItemId) {
          return SelectedState().new(null)
        }

        const targetItem = get(nameListDomain.query.ItemQuery(targetItemId))

        return SelectedState().new(targetItem)
      },
    })

    const updateSelectedName = domain.command({
      name: 'UpdateSelectedName',
      impl: ({ get }, name: Partial<Name>) => {
        const selected = get(SelectedState())

        if (selected === null) {
          return []
        }

        return SelectedState().new({
          ...selected,
          ...name,
        })
      },
    })

    const FilteredListQuery = domain.query({
      name: 'FilteredListQuery',
      impl: ({ get }) => {
        const filterPrefix = get(FilterPrefixState())
        const nameList = get(nameListDomain.query.ItemListQuery())

        if (filterPrefix === '') {
          return nameList
        }

        return nameList.filter((item) => item.surname.startsWith(filterPrefix))
      },
    })

    const syncSelected = domain.command({
      name: 'SyncSelected',
      impl: ({ get }) => {
        const selected = get(SelectedState())

        if (selected === null) {
          return []
        }

        return nameListDomain.command.updateItem(selected)
      },
    })

    const createNameItem = domain.command({
      name: 'CreateNameItem',
      impl: ({ get }) => {
        const created = get(CreatedState())
        const newItem = {
          id: `${nameUid++}`,
          ...created,
        }

        return [nameListDomain.command.addItem(newItem), updateCreated({ name: '', surname: '' })]
      },
    })

    return {
      query: {
        ...nameListDomain.query,
        FilteredListQuery,
        SelectedQuery: SelectedState.Query,
        FilterPrefixQuery: FilterPrefixState.Query,
        CreatedQuery: CreatedState.Query,
      },
      command: {
        ...nameListDomain.command,
        updateFilterPrefix: updateFilterPrefix,
        selectItem: selectItem,
        updateCreated: updateCreated,
        updateSelectedName: updateSelectedName,
        createNameItem: createNameItem,
        syncSelected: syncSelected,
      },
    }
  },
})

export const CRUDApp = () => {
  const domain = useRemeshDomain(CRUD())
  const filteredList = useRemeshQuery(domain.query.FilteredListQuery())
  const filter = useRemeshQuery(domain.query.FilterPrefixQuery())
  const created = useRemeshQuery(domain.query.CreatedQuery())
  const selected = useRemeshQuery(domain.query.SelectedQuery())

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    domain.command.updateFilterPrefix(e.target.value)
  }

  const handleSelect = (itemId: string | null) => {
    domain.command.selectItem(itemId)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selected) {
      domain.command.updateSelectedName({
        name: e.target.value,
      })
    } else {
      domain.command.updateCreated({ name: e.target.value })
    }
  }

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selected) {
      domain.command.updateSelectedName({
        surname: e.target.value,
      })
    } else {
      domain.command.updateCreated({ surname: e.target.value })
    }
  }

  const handleCreate = () => {
    if (selected === null) {
      domain.command.createNameItem()
    }
  }

  const handleSync = () => {
    if (selected) {
      domain.command.syncSelected()
    }
  }

  const handleDelete = () => {
    if (selected) {
      domain.command.deleteItem(selected.id)
      domain.command.selectItem(null)
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
