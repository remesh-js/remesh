import { Remesh, RemeshDomainContext, Capitalize } from '../index'

export type ListModuleOptions<T> = {
  name: Capitalize
  key: (item: T) => string
  default?: T[]
}

export const ListModule = <T>(domain: RemeshDomainContext, options: ListModuleOptions<T>) => {
  const KeyListState = domain.state<string[]>({
    name: `${options.name}.KeyListState`,
    default: [],
  })

  const KeyListQuery = domain.query({
    name: `${options.name}.KeyListQuery`,
    impl: ({ get }) => {
      return get(KeyListState())
    },
  })

  const ItemState = domain.state<string, T>({
    name: `${options.name}.ItemState`,
  })

  const ItemQuery = domain.query({
    name: `${options.name}.ItemQuery`,
    impl: ({ get }, key: string) => {
      return get(ItemState(key))
    },
  })

  const ItemListQuery = domain.query({
    name: `${options.name}.ItemListQuery`,
    impl: ({ get }) => {
      const keyList = get(KeyListQuery())
      return keyList.map((key) => get(ItemState(key)))
    },
  })

  const SetListCommand = domain.command({
    name: `${options.name}.SetListCommand`,
    impl: ({ set }, newList: T[]) => {
      const keyList = newList.map(options.key)

      for (let i = 0; i < keyList.length; i++) {
        const key = keyList[i]
        const item = newList[i]
        set(ItemState(key), item)
      }

      set(KeyListState(), keyList)
    },
  })

  const AddItemCommand = domain.command({
    name: `${options.name}.AddItemCommand`,
    impl: ({ get, send }, newItem: T) => {
      const keyList = get(KeyListState())
      const list = get(ItemListQuery())
      const newKey = options.key(newItem)

      if (keyList.includes(newKey)) {
        return
      }

      send(SetListCommand(list.concat(newItem)))
    },
  })

  const AddItemListCommand = domain.command({
    name: `${options.name}.AddItemListCommand`,
    impl: ({ get, send }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const list = get(ItemListQuery())

      const newList = [] as T[]

      for (const newItem of newItems) {
        const newItemKey = options.key(newItem)

        if (keyList.includes(newItemKey)) {
          continue
        }

        newList.push(newItem)
      }

      if (newList.length === 0) {
        return
      }

      send(SetListCommand(list.concat(newList)))
    },
  })

  const DeleteItemCommand = domain.command({
    name: `${options.name}.DeleteItemCommand`,
    impl: ({ get, send }, targetKey: string) => {
      const list = get(ItemListQuery())
      const newList = list.filter((item) => options.key(item) !== targetKey)

      if (newList.length === list.length) {
        return
      }

      send(SetListCommand(newList))
    },
  })

  const DeleteItemListCommand = domain.command({
    name: `${options.name}.DeleteItemListCommand`,
    impl: ({ get, send }, targetKeys: string[]) => {
      const list = get(ItemListQuery())
      const newList = list.filter((item) => !targetKeys.includes(options.key(item)))

      if (newList.length === list.length) {
        return
      }

      send(SetListCommand(newList))
    },
  })

  const DeleteAllCommand = domain.command({
    name: `${options.name}.DeleteAllCommand`,
    impl: ({ send }) => {
      send(SetListCommand([]))
    },
  })

  const UpdateItemCommand = domain.command({
    name: `${options.name}.UpdateItemCommand`,
    impl: ({ get, send }, newItem: T) => {
      const key = options.key(newItem)
      const keyList = get(KeyListState())

      if (!keyList.includes(key)) {
        return null
      }

      const list = get(ItemListQuery())
      const newList = list.map((item) => {
        if (options.key(item) === key) {
          return newItem
        }
        return item
      })

      send(SetListCommand(newList))
    },
  })

  const UpdateItemListCommand = domain.command({
    name: `${options.name}.UpdateItemListCommand`,
    impl: ({ get, send }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const list = get(ItemListQuery())

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

      send(SetListCommand(newList))
    },
  })

  const InsertAtCommand = domain.command({
    name: `${options.name}.InsertAtCommand`,
    impl: ({ get, send }, { index, item }: { index: number; item: T }) => {
      const keyList = get(KeyListState())

      if (keyList.includes(options.key(item))) {
        return null
      }

      const list = get(ItemListQuery())
      const newList = list.slice(0, index).concat(item).concat(list.slice(index))

      send(SetListCommand(newList))
    },
  })

  const InsertBeforeCommand = domain.command({
    name: `${options.name}.InsertBeforeCommand`,
    impl: ({ get, send }, { before, item }: { before: T; item: T }) => {
      const keyList = get(KeyListState())
      const itemKey = options.key(item)
      const beforeKey = options.key(before)

      if (keyList.includes(itemKey)) {
        return null
      }

      const list = get(ItemListQuery())
      const newList = [] as T[]

      for (const current of list) {
        const currentKey = options.key(current)

        if (currentKey === beforeKey) {
          newList.push(item)
        }

        newList.push(current)
      }

      send(SetListCommand(newList))
    },
  })

  const InsertAfterCommand = domain.command({
    name: `${options.name}.InsertAfterCommand`,
    impl: ({ get, send }, { after, item }: { after: T; item: T }) => {
      const keyList = get(KeyListState())
      const itemKey = options.key(item)
      const afterKey = options.key(after)

      if (keyList.includes(itemKey)) {
        return null
      }

      const list = get(ItemListQuery())
      const newList = [] as T[]

      for (const current of list) {
        const currentKey = options.key(current)

        newList.push(current)

        if (currentKey === afterKey) {
          newList.push(item)
        }
      }

      send(SetListCommand(newList))
    },
  })

  const ResetCommand = domain.command({
    name: `${options.name}.ResetCommand`,
    impl: ({ send }) => {
      send(SetListCommand(options.default ?? []))
    },
  })

  /**
   * sync options.default to item list
   */
  domain.ignite(({ send }) => {
    send(SetListCommand(options.default ?? []))
  })

  return Remesh.module({
    command: {
      SetListCommand,
      AddItemCommand,
      AddItemListCommand,
      DeleteItemCommand,
      DeleteItemListCommand,
      DeleteAllCommand,
      UpdateItemCommand,
      UpdateItemListCommand,
      InsertAtCommand,
      InsertBeforeCommand,
      InsertAfterCommand,
      ResetCommand,
    },
    query: {
      KeyListQuery,
      ItemQuery,
      ItemListQuery,
    },
  })
}
