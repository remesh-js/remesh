import { RemeshDomainContext } from '../index'

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

export type FailedToAddItemEventData = {
  reason: string
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

export type ManyItemsAddedEventData<T> = {
  items: T[]
}

export type ManyItemsUpdatedEventData<T> = {
  previous: T[]
  current: T[]
}

export type ManyItemsDeletedEventData<T> = {
  items: T[]
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

  const FailedToAddItemEvent = domain.event<FailedToAddItemEventData>({
    name: `${options.name}.FailedToAddItemEvent`,
  })

  const ItemUpdatedEvent = domain.event<ItemUpdatedEventData<T>>({
    name: `${options.name}.ItemUpdatedEvent`,
  })

  const FailedToUpdateItemEvent = domain.event<FailedToUpdateItemEventData<T>>({
    name: `${options.name}.FailedToUpdateItemEvent`,
  })

  const ItemDeletedEvent = domain.event<ItemDeletedEventData<T>>({
    name: `${options.name}.ItemDeletedEvent`,
  })

  const ManyItemsAddedEvent = domain.event<ManyItemsAddedEventData<T>>({
    name: `${options.name}.ManyItemsAddedEvent`,
  })

  const ManyItemsUpdatedEvent = domain.event<ManyItemsUpdatedEventData<T>>({
    name: `${options.name}.ManyItemsUpdatedEvent`,
  })

  const ManyItemsDeletedEvent = domain.event<ManyItemsDeletedEventData<T>>({
    name: `${options.name}.ManyItemsDeletedEvent`,
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
        })
      }

      return [setList(list.concat(newItem)), ItemAddedEvent({ item: newItem })]
    },
  })

  const deleteItem = domain.command({
    name: `${options.name}.deleteItem`,
    impl: ({ get }, targetKey: string) => {
      const list = get(itemList())
      const newList = list.filter((item) => options.key(item) !== targetKey)
      const removedItem = get(ItemState(targetKey))

      return [setList(newList), ItemDeletedEvent({ item: removedItem })]
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

  const addManyItems = domain.command({
    name: `${options.name}.addManyItems`,
    impl: ({ get }, newItems: T[]) => {
      const list = get(itemList())
      const keyList = get(KeyListState())
      const itemsToBeAdded = newItems.filter((item) => !keyList.includes(options.key(item)))

      return [
        setList(list.concat(itemsToBeAdded)),
        ManyItemsAddedEvent({ items: itemsToBeAdded })
      ]
    }
  })

  const updateManyItems = domain.command({
    name: `${options.name}.updateManyItems`,
    impl: ({ get }, newItems: T[]) => {
      const list = get(itemList())
      const listMap = new Map(list.map((item) => [options.key(item), item]))

      newItems.forEach(item => {
        const key = options.key(item)
        listMap.set(key, item)
      })

      const newList = Array.from(listMap.values())

      return [
        setList(newList),
        ManyItemsUpdatedEvent({ previous: list, current: newList })
      ]
    }
  })

  const deleteManyItems = domain.command({
    name: `${options.name}.deleteManyItems`,
    impl: ({ get }, targetKeyList: string[]) => {
      const list = get(itemList())
      const newList = list.filter((item) => !targetKeyList.includes(options.key(item)))
      const removedItems = targetKeyList.map((key) => get(ItemState(key)))

      return [
        setList(newList), 
        ManyItemsDeletedEvent({ items: removedItems })
      ]
    }
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
      deleteItem,
      updateItem,
      addManyItems,
      updateManyItems,
      deleteManyItems,
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
      ManyItemsAddedEvent,
      ManyItemsUpdatedEvent,
      ManyItemsDeletedEvent,
    },
  }
}
