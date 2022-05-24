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
  name: 'TodoFilterDomain',
  impl: (domain) => {
    const todoFilterModule = SwitchModule<TodoFilter>(domain, {
      name: 'TodoFilter',
      default: 'all',
    })

    const TodoFilterChangedEvent = domain.event<TodoFilter>({
      name: 'TodoFilterChangedEvent',
    })

    const TodoFilterQuery = todoFilterModule.query.SwitchQuery

    const SetFilterCommand = domain.command({
      name: 'SetFilterCommand',
      impl: ({ send, emit }, input: string) => {
        const filter = getValidTodoFilter(input)

        send(todoFilterModule.command.SwitchCommand(filter))
        emit(TodoFilterChangedEvent(filter))
      },
    })

    syncStorage(domain, TODO_FILTER_STORAGE_KEY)
      .listenTo(TodoFilterChangedEvent)
      .set(({ send }, value) => {
        send(SetFilterCommand(value))
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
