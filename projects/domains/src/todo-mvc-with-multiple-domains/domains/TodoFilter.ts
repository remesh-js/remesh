import { Remesh } from 'remesh'

import { syncStorage } from '../domain-modules/sync-storage'

export const TODO_FILTER_STORAGE_KEY = 'remesh-example/todo-filter'

export type TodoFilter = 'all' | 'active' | 'completed'

export const getValidTodoFilter = (input: string | undefined): TodoFilter => {
  if (input === undefined) {
    return 'all'
  }

  switch (input) {
    case 'all':
    case 'active':
    case 'completed':
      return input
    default:
      return 'all'
  }
}

export const TodoFilterDomain = Remesh.domain({
  name: 'TodoFilterDomain',
  impl: (domain) => {
    const TodoFilterState = domain.state<TodoFilter>({
      name: 'TodoFilterState',
      default: 'all',
    })

    const TodoFilterQuery = domain.query({
      name: 'TodoFilterQuery',
      impl: ({ get }) => {
        return get(TodoFilterState())
      },
    })

    const TodoFilterChangedEvent = domain.event<TodoFilter>({
      name: 'TodoFilterChangedEvent',
    })

    const SetFilterCommand = domain.command({
      name: 'SetFilterCommand',
      impl: ({}, input: string) => {
        const filter = getValidTodoFilter(input)

        return [TodoFilterState().new(filter), TodoFilterChangedEvent(filter)]
      },
    })

    syncStorage(domain, TODO_FILTER_STORAGE_KEY)
      .listenTo(TodoFilterChangedEvent)
      .set(({}, value) => {
        return SetFilterCommand(value)
      })

    return {
      query: {
        TodoFilterQuery,
      },
      command: {
        SetFilterCommand,
      },
      event: {
        TodoFilterChangedEvent,
      },
    }
  },
})
