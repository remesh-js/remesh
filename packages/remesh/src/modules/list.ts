import { Remesh, RemeshDomainContext, DomainConceptName, SerializableObject } from '../index'

export type ListModuleOptions<T extends SerializableObject> = {
  name: DomainConceptName<'ListModule'>
  key: (item: T) => string
  default?: T[]
}

export const ListModule = <T extends SerializableObject>(
  domain: RemeshDomainContext,
  options: ListModuleOptions<T>,
) => {
  const ItemListState = domain.state<T[]>({
    name: `${options.name}.ItemListState`,
    default: options.default ?? [],
  })

  const ItemListQuery = domain.query({
    name: `${options.name}.ItemListQuery`,
    impl: ({ get }) => {
      return get(ItemListState())
    },
  })

  const DerivedQuery = domain.query({
    name: `${options.name}.DerivedQuery`,
    impl: ({ get }) => {
      const itemList = get(ItemListState())
      const keyList = [] as string[]
      const record = {} as Record<string, T>

      for (let i = 0; i < itemList.length; i++) {
        const item = itemList[i]
        const key = options.key(item)
        keyList.push(key)
        record[key] = item
      }

      return { record, keyList }
    },
  })

  const HasItemQuery = domain.query({
    name: `${options.name}.HasItemQuery`,
    impl: ({ get }, key: string) => {
      const itemList = get(ItemListState())
      for (const item of itemList) {
        if (options.key(item) === key) {
          return true
        }
      }
      return false
    },
  })

  const KeyListQuery = domain.query({
    name: `${options.name}.KeyListQuery`,
    impl: ({ get }) => {
      return get(DerivedQuery()).keyList
    },
  })

  const ItemQuery = domain.query({
    name: `${options.name}.ItemQuery`,
    impl: ({ get }, key: string) => {
      const record = get(DerivedQuery()).record

      if (!(key in record)) {
        throw new Error(`${key} in not founded in ${options.name}`)
      }

      const item = record[key]
      return item
    },
    /**
     * return previous when item was deleted
     */
    onError: (_, previous) => {
      return previous
    },
  })

  const SetListCommand = domain.command({
    name: `${options.name}.SetListCommand`,
    impl: ({}, newList: T[]) => {
      return ItemListState().new(newList)
    },
  })

  const AddItemCommand = domain.command({
    name: `${options.name}.AddItemCommand`,
    impl: ({ get }, newItem: T) => {
      const itemList = get(ItemListState())
      const newList = itemList.concat(newItem)

      return SetListCommand(newList)
    },
  })

  const AddItemListCommand = domain.command({
    name: `${options.name}.AddItemListCommand`,
    impl: ({ get }, newItems: T[]) => {
      if (newItems.length === 0) {
        return null
      }
      const itemList = get(ItemListState())
      const newList = itemList.concat(newItems)

      return SetListCommand(newList)
    },
  })

  const DeleteItemCommand = domain.command({
    name: `${options.name}.DeleteItemCommand`,
    impl: ({ get }, targetKey: string) => {
      const list = get(ItemListState())
      const newList = list.filter((item) => options.key(item) !== targetKey)

      if (newList.length === list.length) {
        return null
      }

      return SetListCommand(newList)
    },
  })

  const DeleteItemListCommand = domain.command({
    name: `${options.name}.DeleteItemListCommand`,
    impl: ({ get }, targetKeys: string[]) => {
      const list = get(ItemListQuery())
      const newList = list.filter((item) => !targetKeys.includes(options.key(item)))

      if (newList.length === list.length) {
        return null
      }

      return SetListCommand(newList)
    },
  })

  const DeleteAllCommand = domain.command({
    name: `${options.name}.DeleteAllCommand`,
    impl: ({}) => {
      return SetListCommand([])
    },
  })

  const UpdateItemCommand = domain.command({
    name: `${options.name}.UpdateItemCommand`,
    impl: ({ get }, newItem: T) => {
      const oldList = get(ItemListState())
      const key = options.key(newItem)
      const newList = [] as T[]

      let isChanged = false

      for (const item of oldList) {
        if (options.key(item) === key) {
          newList.push(newItem)
          isChanged = true
        } else {
          newList.push(item)
        }
      }

      if (isChanged) {
        return ItemListState().new(newList)
      }

      return null
    },
  })

  const UpdateItemListCommand = domain.command({
    name: `${options.name}.UpdateItemListCommand`,
    impl: ({ get }, newItems: T[]) => {
      const oldList = get(ItemListState())
      const newList = [] as T[]

      let isChanged = false

      for (const item of oldList) {
        for (const newItem of newItems) {
          if (options.key(item) === options.key(newItem)) {
            newList.push(newItem)
            isChanged = true
            break
          }
        }
        if (!isChanged) {
          newList.push(item)
        }
      }

      if (isChanged) {
        return ItemListState().new(newList)
      }

      return null
    },
  })

  const InsertAtCommand = domain.command({
    name: `${options.name}.InsertAtCommand`,
    impl: ({ get }, { index, item }: { index: number; item: T }) => {
      const keyList = get(KeyListQuery())

      if (keyList.includes(options.key(item))) {
        return null
      }

      const list = get(ItemListQuery())
      const newList = list.slice(0, index).concat(item).concat(list.slice(index))

      return SetListCommand(newList)
    },
  })

  const InsertBeforeCommand = domain.command({
    name: `${options.name}.InsertBeforeCommand`,
    impl: ({ get }, { before, item }: { before: T; item: T }) => {
      const keyList = get(KeyListQuery())
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

      return SetListCommand(newList)
    },
  })

  const InsertAfterCommand = domain.command({
    name: `${options.name}.InsertAfterCommand`,
    impl: ({ get }, { after, item }: { after: T; item: T }) => {
      const keyList = get(KeyListQuery())
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

      return SetListCommand(newList)
    },
  })

  const ResetCommand = domain.command({
    name: `${options.name}.ResetCommand`,
    impl: ({}) => {
      return SetListCommand(options.default ?? [])
    },
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
      HasItemQuery,
      ItemQuery,
      ItemListQuery,
    },
  })
}
