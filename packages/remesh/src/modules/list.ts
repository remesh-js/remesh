import { of } from 'rxjs'
import { RemeshDomainContext } from '../index'
import { undefined2Void } from '../remesh'

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

export const ListModule = <T>(domain: RemeshDomainContext, options: ListModuleOptions<T>) => {
  const KeyListState = domain.state<string[]>({
    name: `${options.name}.KeyListState`,
    default: [],
  })

  const ItemState = domain.state<string, T>({
    name: `${options.name}.ItemState`,
  })

  /**
   * sync options.default to item list
   */
  domain.command$({
    name: `${options.name}.addItemCommand$`,
    inspectable: false,
    impl: () => {
      return of((options.default ?? []).map((item) => addItem(undefined2Void(item))))
    },
  })

  const ItemListQuery = domain.query({
    name: `${options.name}.ItemListQuery`,
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

  const setList = domain.command({
    name: `${options.name}.setList`,
    impl: ({ get }, newList: T[]) => {
      const keyList = newList.map(options.key)
      const oldList = get(ItemListQuery())

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
      const list = get(ItemListQuery())
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
      const list = get(ItemListQuery())
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

      const list = get(ItemListQuery())
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

  return {
    command: {
      setList,
      addItem,
      deleteItem,
      updateItem,
    },
    query: {
      KeyListQuery: KeyListState.Query,
      ItemQuery: ItemState.Query,
      ItemListQuery,
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
