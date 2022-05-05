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

    const TodoInputChangedEvent = domain.event<string>({
      name: 'TodoInputChangedEvent',
    })

    const todoInput = todoInputModule.query.text

    const setTodoInput = domain.command({
      name: 'setTodoInput',
      impl: ({}, newTodoInput: string) => {
        return [todoInputModule.command.setText(newTodoInput), TodoInputChangedEvent(newTodoInput)]
      },
    })

    const clearTodoInput = todoInputModule.command.clearText

    syncStorage(domain, TODO_INPUT_STORAGE_KEY)
      .listenTo(TodoInputChangedEvent)
      .readData((value) => setTodoInput(value))

    return {
      query: {
        todoInput: todoInput,
      },
      command: {
        setTodoInput,
        clearTodoInput,
      },
      event: {
        TodoInputChangedEvent
      },
    }
  },
})
