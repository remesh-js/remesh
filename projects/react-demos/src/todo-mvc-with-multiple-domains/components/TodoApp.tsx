import { Remesh } from 'remesh'
import { RemeshYjs } from 'remesh-yjs'

import { useNavigate } from 'react-router-dom'

import { TodoHeader } from './TodoHeader'
import { TodoList } from './TodoList'
import { TodoFooter } from './TodoFooter'

import { Todo, TodoListDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoList'
import {
  TodoFilter,
  TodoFilterDomain,
} from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoFilter'
import { TodoInputDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoInput'
import { useRemeshDomain, useRemeshEvent } from 'remesh-react'

type SyncedState = {
  todos: Todo[]
  filter: TodoFilter
  input: string
}

const TodoAppDomain = Remesh.domain({
  name: 'TodoAppDomain',
  impl: (domain) => {
    const todoListDomain = domain.getDomain(TodoListDomain())
    const todoFilterDomain = domain.getDomain(TodoFilterDomain())
    const todoInputDomain = domain.getDomain(TodoInputDomain())

    const TodoFilterSyncEvent = domain.event<TodoFilter>({
      name: 'TodoFilterSyncEvent',
    })

    RemeshYjs(domain, {
      key: 'todo-app',
      dataType: 'object',
      onSend: ({ get }): SyncedState => {
        const todos = get(todoListDomain.query.TodoListQuery())
        const filter = get(todoFilterDomain.query.TodoFilterQuery())
        const input = get(todoInputDomain.query.TodoInputQuery())
        return {
          todos,
          filter,
          input,
        }
      },
      onReceive: ({ get }, state: SyncedState) => {
        const filter = get(todoFilterDomain.query.TodoFilterQuery())

        return [
          todoListDomain.command.SetTodoListCommand(state.todos),
          filter !== state.filter ? TodoFilterSyncEvent(state.filter) : null,
          todoInputDomain.command.SetTodoInputCommand(state.input),
        ]
      },
    })

    return {
      event: {
        TodoFilterSyncEvent,
      },
    }
  },
})

export const TodoApp = () => {
  const todoAppDomain = useRemeshDomain(TodoAppDomain())

  const navigate = useNavigate()

  useRemeshEvent(todoAppDomain.event.TodoFilterSyncEvent, (todoFilter) => {
    navigate(`/${todoFilter}`)
  })

  return (
    <div className="todoapp">
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </div>
  )
}
