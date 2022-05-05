import { Remesh } from 'remesh'
import { SwitchModule } from 'remesh/modules/switch'

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
  name: 'TodoFilter',
  impl: (domain) => {
    const todoFilterModule = SwitchModule<TodoFilter>(domain, {
      name: 'TodoFilter',
      default: 'all',
    })

    const TodoFilterChangedEvent = domain.event<TodoFilter>({
      name: 'TodoFilterChangedEvent',
    })

    const todoFilter = todoFilterModule.query.switchState

    const setFilter = domain.command({
      name: 'TodoFilter.setFilter',
      impl: (_, input: string) => {
        const filter = getValidTodoFilter(input)
        return [todoFilterModule.command.switchTo(filter), TodoFilterChangedEvent(filter)]
      },
    })

    syncStorage(domain, TODO_FILTER_STORAGE_KEY)
      .listenTo(TodoFilterChangedEvent)
      .readData((value) => setFilter(value))

    return {
      query: {
        todoFilter: todoFilter,
      },
      command: {
        setFilter,
      },
      event: {
        TodoFilterChangedEvent,
      },
    }
  },
})
