import { Remesh } from '../index'
import { Undefined2Void } from '../remesh'

export type ListModuleOptions<T> = {
  name: string
  getKey: (item: T) => string
  createItem: (key: string) => T
}

export const ListModule = <T>(options: ListModuleOptions<T>) => {
  return Remesh.module((domain) => {
    const KeyListState = domain.state<string[]>({
      name: `${options.name}.KeyListState`,
      default: [],
    })

    const ItemState = domain.state({
      name: `${options.name}.ItemState`,
      impl: (key: string) => {
        return options.createItem(key)
      },
    })

    const ItemListQuery = domain.query({
      name: `${options.name}.ItemListQuery`,
      impl: ({ get }) => {
        return get(KeyListState()).map((key) => get(ItemState(key)))
      },
    })

    const setList = domain.command({
      name: `${options.name}.setList`,
      impl: (_, list: T[]) => {
        const keyList = list.map(options.getKey)

        return [KeyListState().new(keyList), ...list.map((item) => ItemState(options.getKey(item)).new(item))]
      },
    })

    const addItem = domain.command({
      name: `${options.name}.addItem`,
      impl: ({ get }, newItem: T) => {
        const keyList = get(KeyListState())
        const newKey = options.getKey(newItem)

        if (keyList.includes(newKey)) {
          return []
        }

        return [KeyListState().new(keyList.concat(newKey)), ItemState(newKey).new(newItem)]
      },
    })

    const removeItem = domain.command({
      name: `${options.name}.removeItem`,
      impl: ({ get }, targetKey: string) => {
        const keyList = get(KeyListState())
        const newKeyList = keyList.filter((key) => key !== targetKey)

        return KeyListState().new(newKeyList)
      },
    })

    const updateItem = domain.command({
      name: `${options.name}.updateItem`,
      impl: ({ get }, newItem: T) => {
        const key = options.getKey(newItem)
        const keyList = get(KeyListState())

        if (!keyList.includes(key)) {
          return addItem(newItem as Undefined2Void<T>)
        }

        return ItemState(key).new(newItem)
      },
    })

    return {
      command: {
        setList,
        addItem,
        removeItem,
        updateItem,
      },
      query: {
        KeyListQuery: KeyListState.Query,
        ItemQuery: ItemState.Query,
        ItemListQuery,
      },
    }
  })
}
