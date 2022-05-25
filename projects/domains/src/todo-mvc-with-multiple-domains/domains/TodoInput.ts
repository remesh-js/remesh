import { Remesh } from 'remesh'
import { TextModule } from 'remesh/modules/text'

import { syncStorage } from '../domain-modules/sync-storage'

export const TODO_INPUT_STORAGE_KEY = 'remesh-example/todo-input'

export const TodoInputDomain = Remesh.domain({
  name: 'TodoInputDomain',
  impl: (domain) => {
    const todoInputModule = TextModule(domain, {
      name: 'TodoInput',
    })

    const TodoInputChangedEvent = domain.event<string>({
      name: 'TodoInputChangedEvent',
    })

    const TodoInputQuery = todoInputModule.query.TextQuery

    const SetTodoInputCommand = domain.command({
      name: 'SetTodoInputCommand',
      impl: ({ send, emit }, newTodoInput: string) => {
        send(todoInputModule.command.SetTextCommand(newTodoInput))
        emit(TodoInputChangedEvent(newTodoInput))
      },
    })

    const ClearTodoInputCommand = domain.command({
      name: 'ClearTodoInputCommand',
      impl: ({ send, emit, get }) => {
        send(todoInputModule.command.ClearTextCommand())
        emit(TodoInputChangedEvent(get(TodoInputQuery())))
      },
    })

    syncStorage(domain, TODO_INPUT_STORAGE_KEY)
      .listenTo(TodoInputChangedEvent)
      .set(({ send }, value) => {
        send(SetTodoInputCommand(value))
      })

    return {
      query: {
        TodoInputQuery,
      },
      command: {
        SetTodoInputCommand,
        ClearTodoInputCommand,
      },
      event: {
        TodoInputChangedEvent,
      },
    }
  },
})
