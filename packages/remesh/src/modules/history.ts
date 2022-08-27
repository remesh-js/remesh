import { map, startWith } from 'rxjs/operators'

import { deepEqual } from './utils/deepEqual'

import {
  DomainConceptName,
  Remesh,
  RemeshAction,
  RemeshCommandContext,
  RemeshDomainContext,
  RemeshQueryContext,
  Serializable,
  SerializableObject,
} from '../index'

import { getTimingOperatorFunction, TimingConfig } from './utils/timing'

export type HistoryModuleOptions<T extends Serializable> = {
  name: DomainConceptName<'HistoryModule'>
  inspectable?: boolean
  query: (context: RemeshQueryContext) => T
  command: (context: RemeshCommandContext, value: T) => RemeshAction
  maxLength?: number
  timing?: TimingConfig
  default?: T[]
}

export const HistoryModule = <T extends SerializableObject>(
  domain: RemeshDomainContext,
  options: HistoryModuleOptions<T>,
) => {
  const maxLength = options.maxLength ?? 20

  const getHistoryList = (list: T[]) => {
    if (list.length >= maxLength) {
      return list.slice(-maxLength)
    }
    return list
  }

  const HistoryListState = domain.state<T[]>({
    name: 'HistoryListState',
    default: options.default ? getHistoryList(options.default) : [],
  })

  const CurrentIndexState = domain.state<number | null>({
    name: 'CurrentIndexState',
    default: null,
  })

  const CurrentIndexQuery = domain.query({
    name: 'CurrentIndexQuery',
    impl: ({ get }) => {
      const index = get(CurrentIndexState())
      return index
    },
  })

  const SetCommand = domain.command({
    name: 'SetCommand',
    impl: ({ get }, list: T[]) => {
      const newList = getHistoryList(list)
      const index = get(CurrentIndexState())

      if (index === null) {
        return HistoryListState().new(newList)
      }

      return [HistoryListState().new(newList), CurrentIndexState().new(newList.length - 1)]
    },
  })

  const AddCommand = domain.command({
    name: 'AddCommand',
    impl: ({ get }, state: T) => {
      const list = get(HistoryListQuery())
      const index = get(CurrentIndexState())

      if (index === null || index === list.length - 1) {
        return SetCommand(list.concat(state))
      }

      return SetCommand(list.slice(-(index + 1)).concat(state))
    },
  })

  const ReplaceCommand = domain.command({
    name: 'ReplaceCommand',
    impl: ({ get }, state: T) => {
      const list = get(HistoryListQuery())
      const index = get(CurrentIndexState())

      if (index === null || index === list.length - 1) {
        return SetCommand(list.concat(state))
      }

      return SetCommand(list.slice(-index).concat(state))
    },
  })

  const HistoryListQuery = domain.query({
    name: 'HistoryListQuery',
    impl: ({ get }) => {
      return get(HistoryListState())
    },
  })

  const CurrentStateQuery = domain.query({
    name: 'CurrentStateQuery',
    impl: ({ get }): T | null => {
      const list = get(HistoryListState())
      const index = get(CurrentIndexQuery())

      if (index === null) {
        return null
      }

      return list[index] ?? null
    },
  })

  const CanBackQuery = domain.query({
    name: 'CanBackQuery',
    impl: ({ get }) => {
      const list = get(HistoryListState())
      const index = get(CurrentIndexState())

      if (index === null) {
        return list.length > 1
      }

      return index > 0 && list.length > 1
    },
  })

  const CanForwardQuery = domain.query({
    name: 'CanForwardQuery',
    impl: ({ get }) => {
      const list = get(HistoryListState())
      const index = get(CurrentIndexQuery())

      if (index === null) {
        return false
      }

      return list.length > 1 && index < list.length - 1
    },
  })

  const GoEvent = domain.event<number>({
    name: 'GoEvent',
  })

  const BackEvent = domain.event({
    name: 'BackEvent',
  })

  const ForwardEvent = domain.event({
    name: 'ForwardEvent',
  })

  const GoCommand = domain.command({
    name: 'GoCommand',
    impl: ({ get }, offset: number) => {
      const list = get(HistoryListQuery())

      if (list.length === 0 || offset === 0) {
        return null
      }

      const currentIndex = get(CurrentIndexQuery()) ?? list.length - 1

      const nextIndex = currentIndex + offset

      if (nextIndex < 0 || nextIndex >= list.length) {
        return null
      }

      const state = list[nextIndex]

      return [
        CurrentIndexState().new(nextIndex),
        options.command({ get }, state),
        GoEvent(offset),
        offset > 0 ? ForwardEvent() : BackEvent(),
      ]
    },
  })

  const BackCommand = domain.command({
    name: 'BackCommand',
    impl: ({}) => {
      return GoCommand(-1)
    },
  })

  const ForwardCommand = domain.command({
    name: 'ForwardCommand',
    impl: ({}) => {
      return GoCommand(1)
    },
  })

  const InputQuery = domain.query({
    name: 'InputQuery',
    impl: options.query,
  })

  domain.effect({
    name: 'HistoryEffect',
    impl: ({ fromQuery, get }) => {
      return fromQuery(InputQuery()).pipe(
        getTimingOperatorFunction(options.timing),
        startWith(get(InputQuery())),
        map((state) => {
          const current = get(CurrentStateQuery())

          if (deepEqual(current, state)) {
            return null
          }

          return AddCommand(state)
        }),
      )
    },
  })

  return Remesh.module({
    query: {
      HistoryListQuery,
      CanBackQuery,
      CanForwardQuery,
      CurrentIndexQuery,
      CurrentStateQuery,
    },
    command: {
      GoCommand,
      AddCommand,
      SetCommand,
      ReplaceCommand,
      BackCommand,
      ForwardCommand,
    },
    event: {
      BackEvent,
      ForwardEvent,
      GoEvent,
    },
  })
}
