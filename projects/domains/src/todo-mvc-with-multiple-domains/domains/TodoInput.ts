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
      impl: ({}, newTodoInput: string) => {
        return [todoInputModule.command.SetTextCommand(newTodoInput), TodoInputChangedEvent(newTodoInput)]
      },
    })

    const ClearTodoInputCommand = domain.command({
      name: 'ClearTodoInputCommand',
      impl: ({ get }) => {
        return [todoInputModule.command.ClearTextCommand(), TodoInputChangedEvent('')]
      },
    })

    syncStorage(domain, TODO_INPUT_STORAGE_KEY)
      .listenTo(TodoInputChangedEvent)
      .set(({}, value) => {
        return SetTodoInputCommand(value)
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
