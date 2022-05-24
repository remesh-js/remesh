import { Remesh } from 'remesh'
import { ListModule } from 'remesh/modules/list'

export type Name = {
  name: string
  surname: string
}

export type NameItem = {
  id: string
} & Name

export const CRUDDomain = Remesh.domain({
  name: 'CRUDDomain',
  impl: (domain) => {
    let nameUid = 0

    const nameListModule = ListModule<NameItem>(domain, {
      name: 'NameListModule',
      key: (item) => item.id,
    })

    const FilterPrefixState = domain.state({
      name: 'FilterPrefixState',
      default: '',
    })

    const FilterPrefixQuery = domain.query({
      name: 'FilterPrefixQuery',
      impl: ({ get }) => {
        return get(FilterPrefixState())
      },
    })

    const UpdateFilterPrefixCommand = domain.command({
      name: 'UpdateFilterPrefixCommand',
      impl: ({ set }, prefix: string) => {
        set(FilterPrefixState(), prefix)
      },
    })

    const CreatedState = domain.state<Name>({
      name: 'CreatedState',
      default: {
        name: '',
        surname: '',
      },
    })

    const CreatedQuery = domain.query({
      name: 'CreatedQuery',
      impl: ({ get }) => {
        return get(CreatedState())
      },
    })

    const UpdateCreatedCommand = domain.command({
      name: 'UpdateCreatedCommand',
      impl: ({ get, set }, name: Partial<Name>) => {
        const currentName = get(CreatedState())

        set(CreatedState(), {
          ...currentName,
          ...name,
        })
      },
    })

    const SelectedState = domain.state<NameItem | null>({
      name: 'SelectedState',
      default: null,
    })

    const SelectedQuery = domain.query({
      name: 'SelectedQuery',
      impl: ({ get }) => {
        return get(SelectedState())
      },
    })

    const SelectItemCommand = domain.command({
      name: 'SelectItemCommand',
      impl: ({ get, set }, targetItemId: string | null) => {
        const currentSelected = get(SelectedState())

        if (targetItemId === null) {
          if (currentSelected === null) {
            return null
          } else {
            set(SelectedState(), null)
            return
          }
        }

        if (currentSelected && currentSelected.id === targetItemId) {
          set(SelectedState(), null)
          return
        }

        const targetItem = get(nameListModule.query.ItemQuery(targetItemId))

        set(SelectedState(), targetItem)
      },
    })

    const UpdateSelectedNameCommand = domain.command({
      name: 'UpdateSelectedNameCommand',
      impl: ({ get, set }, name: Partial<Name>) => {
        const selected = get(SelectedState())

        if (selected === null) {
          return
        }

        set(SelectedState(), {
          ...selected,
          ...name,
        })
      },
    })

    const FilteredListQuery = domain.query({
      name: 'FilteredListQuery',
      impl: ({ get }) => {
        const filterPrefix = get(FilterPrefixState())
        const nameList = get(nameListModule.query.ItemListQuery())

        if (filterPrefix === '') {
          return nameList
        }

        return nameList.filter((item) => item.surname.startsWith(filterPrefix))
      },
    })

    const SyncSelectedCommand = domain.command({
      name: 'SyncSelectedCommand',
      impl: ({ get, send }) => {
        const selected = get(SelectedState())

        if (selected === null) {
          return
        }

        send(nameListModule.command.UpdateItemCommand(selected))
      },
    })

    const CreateNameItemCommand = domain.command({
      name: 'CreateNameItemCommand',
      impl: ({ get, send }) => {
        const created = get(CreatedState())
        const newItem = {
          id: `${nameUid++}`,
          ...created,
        }

        send(nameListModule.command.AddItemCommand(newItem))
        send(UpdateCreatedCommand({ name: '', surname: '' }))
      },
    })

    return {
      query: {
        ...nameListModule.query,
        FilteredListQuery,
        SelectedQuery,
        FilterPrefixQuery,
        CreatedQuery,
      },
      command: {
        ...nameListModule.command,
        UpdateFilterPrefixCommand,
        SelectItemCommand,
        UpdateCreatedCommand,
        UpdateSelectedNameCommand,
        CreateNameItemCommand,
        SyncSelectedCommand,
      },
    }
  },
})
