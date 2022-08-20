import { Remesh } from 'remesh'

import { syncStorage } from '../domain-modules/sync-storage'

export const TODO_INPUT_STORAGE_KEY = 'remesh-example/todo-input'

export const TodoInputDomain = Remesh.domain({
  name: 'TodoInputDomain',
  impl: (domain) => {
    const TodoTextState = domain.state<string>({
      name: 'TodoTextState',
      default: '',
    })

    const TodoInputQuery = domain.query({
      name: 'TodoTextQuery',
      impl: ({ get }) => {
        return get(TodoTextState())
      },
    })

    const TodoInputChangedEvent = domain.event<string>({
      name: 'TodoInputChangedEvent',
    })

    const SetTodoInputCommand = domain.command({
      name: 'SetTodoInputCommand',
      impl: ({}, newTodoInput: string) => {
        return [TodoTextState().new(newTodoInput), TodoInputChangedEvent(newTodoInput)]
      },
    })

    const ClearTodoInputCommand = domain.command({
      name: 'ClearTodoInputCommand',
      impl: ({ get }) => {
        return [TodoTextState().new(''), TodoInputChangedEvent('')]
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
