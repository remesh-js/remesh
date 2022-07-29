import { Remesh, RemeshDomainContext, Capitalize, SerializableObject, RemeshEntityItemUpdatePayload } from '../index'

export type ListModuleOptions<T extends SerializableObject> = {
  name: Capitalize
  key: (item: T) => string
  default?: T[]
}

export const ListModule = <T extends SerializableObject>(
  domain: RemeshDomainContext,
  options: ListModuleOptions<T>,
) => {
  const KeyListState = domain.state<string[]>({
    name: `${options.name}.KeyListState`,
    default: options.default?.map(options.key) ?? [],
  })

  const KeyListQuery = domain.query({
    name: `${options.name}.KeyListQuery`,
    impl: ({ get }) => {
      return get(KeyListState())
    },
  })

  const ItemEntity = domain.entity<T>({
    name: `${options.name}.ItemEntity`,
    key: options.key,
    injectEntities: options.default,
  })

  const ItemQuery = domain.query({
    name: `${options.name}.ItemQuery`,
    impl: ({ get }, key: string) => {
      return get(ItemEntity(key))
    },
  })

  const ItemListQuery = domain.query({
    name: `${options.name}.ItemListQuery`,
    impl: ({ get }) => {
      const keyList = get(KeyListQuery())
      return keyList.map((key) => get(ItemEntity(key)))
    },
  })

  const SetListCommand = domain.command({
    name: `${options.name}.SetListCommand`,
    impl: ({}, newList: T[]) => {
      const keyList = [] as string[]
      const itemUpdatePayloadList = [] as RemeshEntityItemUpdatePayload<T>[]

      for (const item of newList) {
        const key = options.key(item)
        const itemUpdatePayload = ItemEntity(key).new(item)
        keyList.push(key)
        itemUpdatePayloadList.push(itemUpdatePayload)
      }

      return [KeyListState().new(keyList), itemUpdatePayloadList]
    },
  })

  const AddItemCommand = domain.command({
    name: `${options.name}.AddItemCommand`,
    impl: ({ get }, newItem: T) => {
      const keyList = get(KeyListState())
      const newKey = options.key(newItem)

      if (keyList.includes(newKey)) {
        return null
      }

      return [KeyListState().new([...keyList, newKey]), ItemEntity(newKey).new(newItem)]
    },
  })

  const AddItemListCommand = domain.command({
    name: `${options.name}.AddItemListCommand`,
    impl: ({ get }, newItems: T[]) => {
      if (newItems.length === 0) {
        return null
      }

      const keyList = get(KeyListState())

      const itemUpdatePayloadList = [] as RemeshEntityItemUpdatePayload<T>[]
      const newKeyList = [...keyList]

      for (const newItem of newItems) {
        const newItemKey = options.key(newItem)

        if (newKeyList.includes(newItemKey)) {
          continue
        }

        itemUpdatePayloadList.push(ItemEntity(newItemKey).new(newItem))
        newKeyList.push(newItemKey)
      }

      return [KeyListState().new(newKeyList), itemUpdatePayloadList]
    },
  })

  const DeleteItemCommand = domain.command({
    name: `${options.name}.DeleteItemCommand`,
    impl: ({ get }, targetKey: string) => {
      const list = get(ItemListQuery())
      const newList = list.filter((item) => options.key(item) !== targetKey)

      if (newList.length === list.length) {
        return null
      }

      return [SetListCommand(newList)]
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
      const key = options.key(newItem)
      const keyList = get(KeyListState())

      if (!keyList.includes(key)) {
        return null
      }

      return [ItemEntity(key).new(newItem)]
    },
  })

  const UpdateItemListCommand = domain.command({
    name: `${options.name}.UpdateItemListCommand`,
    impl: ({ get }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const newList = [] as RemeshEntityItemUpdatePayload<T>[]

      for (const newItem of newItems) {
        const itemKey = options.key(newItem)

        if (keyList.includes(itemKey)) {
          newList.push(ItemEntity(itemKey).new(newItem))
        }
      }

      return newList
    },
  })

  const InsertAtCommand = domain.command({
    name: `${options.name}.InsertAtCommand`,
    impl: ({ get }, { index, item }: { index: number; item: T }) => {
      const keyList = get(KeyListState())

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

      return SetListCommand(newList)
    },
  })

  const InsertAfterCommand = domain.command({
    name: `${options.name}.InsertAfterCommand`,
    impl: ({ get }, { after, item }: { after: T; item: T }) => {
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
      ItemQuery,
      ItemListQuery,
    },
  })
}
