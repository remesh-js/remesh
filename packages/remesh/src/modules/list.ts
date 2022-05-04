import { RemeshDomainContext, RemeshEventPayload } from '../index'

export type ListModuleOptions<T> = {
  name: string
  key: (item: T) => string
  default?: T[]
}

export type ListChangedEventData<T> = {
  previous: T[]
  current: T[]
}

export type ItemAddedEventData<T> = {
  item: T
}

export type FailedToAddItemEventData<T> = {
  reason: string
  items: T[]
}

export type FailedToInsertItemEventData<T> = {
  reason: string
  item: T
}

export type ItemUpdatedEventData<T> = {
  previous: T
  current: T
}

export type FailedToUpdateItemEventData<T> = {
  item: T
  reason: string
}

export type ItemDeletedEventData<T> = {
  item: T
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

  const ListChangedEvent = domain.event<ListChangedEventData<T>>({
    name: `${options.name}.ListChangedEvent`,
  })

  const ItemAddedEvent = domain.event<ItemAddedEventData<T>>({
    name: `${options.name}.ItemAddedEvent`,
  })

  const FailedToAddItemEvent = domain.event<FailedToAddItemEventData<T>>({
    name: `${options.name}.FailedToAddItemEvent`,
  })

  const ItemUpdatedEvent = domain.event<ItemUpdatedEventData<T>>({
    name: `${options.name}.ItemUpdatedEvent`,
  })

  const FailedToUpdateItemEvent = domain.event<FailedToUpdateItemEventData<T>>({
    name: `${options.name}.FailedToUpdateItemEvent`,
  })

  const FailedToInsertItemEvent = domain.event<FailedToAddItemEventData<T>>({
    name: `${options.name}.FailedToInsertItemEvent`,
  })

  const ItemDeletedEvent = domain.event<ItemDeletedEventData<T>>({
    name: `${options.name}.ItemDeletedEvent`,
  })

  const setList = domain.command({
    name: `${options.name}.setList`,
    impl: ({ get }, newList: T[]) => {
      const keyList = newList.map(options.key)
      const oldList = get(itemList())

      return [
        newList.map((item, index) => ItemState(keyList[index]).new(item)),
        KeyListState().new(keyList),
        ListChangedEvent({ previous: oldList, current: newList }),
      ]
    },
  })

  const addItem = domain.command({
    name: `${options.name}.addItem`,
    impl: ({ get }, newItem: T) => {
      const keyList = get(KeyListState())
      const list = get(itemList())
      const newKey = options.key(newItem)

      if (keyList.includes(newKey)) {
        return FailedToAddItemEvent({
          reason: 'item already exists',
          items: [newItem],
        })
      }

      return [setList(list.concat(newItem)), ItemAddedEvent({ item: newItem })]
    },
  })

  const addItems = domain.command({
    name: `${options.name}.addItems`,
    impl: ({ get }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const list = get(itemList())

      const duplicatedItems = newItems.filter((item) => keyList.includes(options.key(item)))

      if (duplicatedItems.length) {
        return FailedToAddItemEvent({
          reason: 'These items already exists',
          items: duplicatedItems,
        })
      }

      return [setList(list.concat(...newItems)), newItems.map((item) => ItemAddedEvent({ item }))]
    },
  })

  const deleteItem = domain.command({
    name: `${options.name}.deleteItem`,
    impl: ({ get }, targetKey: string) => {
      const list = get(itemList())
      const newList = list.filter((item) => options.key(item) !== targetKey)
      const deletedItem = get(ItemState(targetKey))

      return [setList(newList), ItemDeletedEvent({ item: deletedItem })]
    },
  })

  const deleteItems = domain.command({
    name: `${options.name}.deleteItems`,
    impl: ({ get }, targetKeys: string[]) => {
      const list = get(itemList())
      const newList = list.filter((item) => !targetKeys.includes(options.key(item)))
      const deletedItems = targetKeys.map((key) => get(ItemState(key)))

      return [setList(newList), deletedItems.map((item) => ItemDeletedEvent({ item }))]
    },
  })

  const deleteAll = domain.command({
    name: `${options.name}.deleteAll`,
    impl: ({ get }) => {
      const list = get(itemList())

      return [setList([]), list.map((item) => ItemDeletedEvent({ item }))]
    },
  })

  const updateItem = domain.command({
    name: `${options.name}.updateItem`,
    impl: ({ get }, newItem: T) => {
      const key = options.key(newItem)
      const keyList = get(KeyListState())

      if (!keyList.includes(key)) {
        return FailedToUpdateItemEvent({
          item: newItem,
          reason: 'item does not exist',
        })
      }

      const list = get(itemList())
      const newList = list.map((item) => {
        if (options.key(item) === key) {
          return newItem
        }
        return item
      })

      const oldItem = get(ItemState(key))

      return [setList(newList), ItemUpdatedEvent({ previous: oldItem, current: newItem })]
    },
  })

  const updateItems = domain.command({
    name: `${options.name}.updateItems`,
    impl: ({ get }, newItems: T[]) => {
      const keyList = get(KeyListState())
      const list = get(itemList())

      const updateItemKeys = newItems.map((item) => options.key(item))
      const newList = [] as T[]
      const eventList = [] as RemeshEventPayload<ItemUpdatedEventData<T>, ItemUpdatedEventData<T>>[]

      for (const [index, key] of keyList.entries()) {
        const updateItemIndex = updateItemKeys.indexOf(key)
        const oldItem = list[index]

        if (updateItemIndex !== -1) {
          const newItem = newItems[updateItemIndex]
          newList.push(newItem)
          eventList.push(ItemUpdatedEvent({ previous: oldItem, current: newItems[updateItemIndex] }))
        } else {
          newList.push(list[index])
        }
      }

      return [setList(newList), eventList]
    },
  })

  const insertItem = domain.command({
    name: `${options.name}.insertItem`,
    impl: ({ get }, { index, item }: { index: number; item: T }) => {
      const keyList = get(KeyListState())

      if (keyList.includes(options.key(item))) {
        return FailedToAddItemEvent({
          reason: 'item already exists',
          items: [item],
        })
      }

      const list = get(itemList())

      return [setList(list.slice(0, index).concat(item).concat(list.slice(index))), ItemAddedEvent({ item })]
    },
  })

  const insertBefore = domain.command({
    name: `${options.name}.insertBefore`,
    impl: ({ get }, { before, item }: { before: T; item: T }) => {
      const keyList = get(KeyListState())
      const itemKey = options.key(item)
      const beforeKey = options.key(before)

      if (keyList.includes(itemKey)) {
        return FailedToAddItemEvent({
          reason: 'item already exists',
          items: [item],
        })
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

      return [setList(newList), ItemAddedEvent({ item })]
    },
  })

  const insertAfter = domain.command({
    name: `${options.name}.insertAfter`,
    impl: ({ get }, { after, item }: { after: T; item: T }) => {
      const keyList = get(KeyListState())
      const itemKey = options.key(item)
      const afterKey = options.key(after)

      if (keyList.includes(itemKey)) {
        return FailedToAddItemEvent({
          reason: 'item already exists',
          items: [item],
        })
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

      return [setList(newList), ItemAddedEvent({ item })]
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
      insertItem,
      insertBefore,
      insertAfter,
    },
    query: {
      keyList: KeyListState.query,
      item: ItemState.query,
      itemList,
    },
    event: {
      ListChangedEvent,
      ItemAddedEvent,
      FailedToAddItemEvent,
      ItemUpdatedEvent,
      FailedToUpdateItemEvent,
      ItemDeletedEvent,
    },
  }
}
