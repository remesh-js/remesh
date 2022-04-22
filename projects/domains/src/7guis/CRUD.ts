import { Remesh } from 'remesh'
import { ListModule } from 'remesh/modules/list'

export type Name = {
  name: string
  surname: string
}

export type NameItem = {
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

        const targetItem = get(nameListDomain.query.item(targetItemId))

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

    const filteredList = domain.query({
      name: 'FilteredListQuery',
      impl: ({ get }) => {
        const filterPrefix = get(FilterPrefixState())
        const nameList = get(nameListDomain.query.itemList())

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
        filteredList: filteredList,
        selected: SelectedState.query,
        filterPrefix: FilterPrefixState.query,
        created: CreatedState.query,
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
