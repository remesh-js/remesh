import { Remesh } from 'remesh'
import { TextModule } from 'remesh/modules/text'

import { syncStorage } from '../domain-modules/sync-storage'

export const TODO_INPUT_STORAGE_KEY = 'remesh-example/todo-input'

export const TodoInputDomain = Remesh.domain({
  name: 'TodoInput',
  impl: (domain) => {
    const todoInputModule = TextModule(domain, {
      name: 'TodoInput',
    })

    const TodoInputQuery = todoInputModule.query.TextQuery

    const TodoInputChangedEvent = todoInputModule.event.TextChangedEvent

    const TodoInputClearedEvent = todoInputModule.event.TextClearedEvent

    const setTodoInput = todoInputModule.command.setText

    const clearTodoInput = todoInputModule.command.clearText

    syncStorage(domain, TODO_INPUT_STORAGE_KEY)
      .listenTo(TodoInputChangedEvent)
      .saveData((event) => event.current)
      .readData((value) => setTodoInput(value))

    return {
      query: {
        TodoInputQuery,
      },
      command: {
        setTodoInput,
        clearTodoInput,
      },
      event: {
        TodoInputChangedEvent,
        TodoInputClearedEvent,
      },
    }
  },
})
