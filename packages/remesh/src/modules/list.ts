import { RemeshDomainContext } from '../index'

export type ListModuleOptions<T> = {
  name: string
  key: (item: T) => string
  default?: T[]
}

export const ListModule = <T>(domain: RemeshDomainContext, options: ListModuleOptions<T>) => {
  const KeyListState = domain.state<string[]>({
    name: `${options.name}.KeyListState`,
    default: [],
  })

  const ItemState = domain.state<string, T>({
    name: `${options.name}.ItemState`,
  })

  const itemList = domain.query({
    name: `${options.name}.itemList`,
    impl: ({ get }) => {
      return get(KeyListState()).map((key) => get(ItemState(key)))
    },
  })

  const setList = domain.command({
    name: `${options.name}.setList`,
    impl: ( _ , newList: T[]) => {
      const keyList = newList.map(options.key)

      return [newList.map((item, index) => ItemState(keyList[index]).new(item)), KeyListState().new(keyList)]
    },
  })

  const addItem = domain.command({
    name: `${options.name}.addItem`,
    impl: ({ get }, newItem: T) => {
      const keyList = get(KeyListState())
      const list = get(itemList())
      const newKey = options.key(newItem)

      if (keyList.includes(newKey)) {
        return null
      }

      return setList(list.concat(newItem))
    },
  })

  const addItems = domain.command({
    name: `${options.name}.addItems`,
    impl: ({ get }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const list = get(itemList())

      const newList = [] as T[]

      for (const newItem of newItems) {
        const newItemKey = options.key(newItem)

        if (keyList.includes(newItemKey)) {
          continue
        }

        newList.push(newItem)
      }

      if (newList.length === 0) {
        return null
      }

      return setList(list.concat(newList))
    },
  })

  const deleteItem = domain.command({
    name: `${options.name}.deleteItem`,
    impl: ({ get }, targetKey: string) => {
      const list = get(itemList())
      const newList = list.filter((item) => options.key(item) !== targetKey)

      return setList(newList)
    },
  })

  const deleteItems = domain.command({
    name: `${options.name}.deleteItems`,
    impl: ({ get }, targetKeys: string[]) => {
      const list = get(itemList())
      const newList = list.filter((item) => !targetKeys.includes(options.key(item)))

      return setList(newList)
    },
  })

  const deleteAll = domain.command({
    name: `${options.name}.deleteAll`,
    impl: ( _ ) => {
      return setList([])
    },
  })

  const updateItem = domain.command({
    name: `${options.name}.updateItem`,
    impl: ({ get }, newItem: T) => {
      const key = options.key(newItem)
      const keyList = get(KeyListState())

      if (!keyList.includes(key)) {
        return null
      }

      const list = get(itemList())
      const newList = list.map((item) => {
        if (options.key(item) === key) {
          return newItem
        }
        return item
      })

      return setList(newList)
    },
  })

  const updateItems = domain.command({
    name: `${options.name}.updateItems`,
    impl: ({ get }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const list = get(itemList())

      const updateItemKeys = newItems.map((item) => options.key(item))
      const newList = [] as T[]

      for (const [index, key] of keyList.entries()) {
        const updateItemIndex = updateItemKeys.indexOf(key)

        if (updateItemIndex !== -1) {
          const newItem = newItems[updateItemIndex]
          newList.push(newItem)
        } else {
          newList.push(list[index])
        }
      }

      return setList(newList)
    },
  })

  const insertAt = domain.command({
    name: `${options.name}.insertAt`,
    impl: ({ get }, { index, item }: { index: number; item: T }) => {
      const keyList = get(KeyListState())

      if (keyList.includes(options.key(item))) {
        return null
      }

      const list = get(itemList())
      const newList = list.slice(0, index).concat(item).concat(list.slice(index))

      return setList(newList)
    },
  })

  const insertBefore = domain.command({
    name: `${options.name}.insertBefore`,
    impl: ({ get }, { before, item }: { before: T; item: T }) => {
      const keyList = get(KeyListState())
      const itemKey = options.key(item)
      const beforeKey = options.key(before)

      if (keyList.includes(itemKey)) {
        return null
      }

      const list = get(itemList())
      const newList = [] as T[]

      for (const current of list) {
        const currentKey = options.key(current)

        if (currentKey === beforeKey) {
          newList.push(item)
        }

        newList.push(current)
      }

      return setList(newList)
    },
  })

  const insertAfter = domain.command({
    name: `${options.name}.insertAfter`,
    impl: ({ get }, { after, item }: { after: T; item: T }) => {
      const keyList = get(KeyListState())
      const itemKey = options.key(item)
      const afterKey = options.key(after)

      if (keyList.includes(itemKey)) {
        return null
      }

      const list = get(itemList())
      const newList = [] as T[]

      for (const current of list) {
        const currentKey = options.key(current)

        newList.push(current)

        if (currentKey === afterKey) {
          newList.push(item)
        }
      }

      return setList(newList)
    },
  })

  const reset = domain.command({
    name: `${options.name}.reset`,
    impl: () => {
      return setList(options.default ?? [])
    },
  })

  /**
   * sync options.default to item list
   */
  domain.ignite(() => {
    return setList(options.default ?? [])
  })

  return {
    command: {
      setList,
      addItem,
      addItems,
      deleteItem,
      deleteItems,
      deleteAll,
      updateItem,
      updateItems,
      insertAt,
      insertBefore,
      insertAfter,
      reset,
    },
    query: {
      keyList: KeyListState.query,
      item: ItemState.query,
      itemList,
    },
  }
}
