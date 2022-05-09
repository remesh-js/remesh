import { Remesh } from 'remesh'

import { filter, map } from 'rxjs/operators'

import { TodoInputDomain } from './TodoInput'
import { TodoListDomain, getTodoId } from './TodoList'
import { TodoFilterDomain } from './TodoFilter'

export const TodoAppDomain = Remesh.domain({
  name: 'TodoAppDomain',
  impl: (domain) => {
    const todoHeader = domain.getDomain(TodoInputDomain())
    const todoList = domain.getDomain(TodoListDomain())
    const todoFooter = domain.getDomain(TodoFilterDomain())

    const FilteredTodoKeyListQuery = domain.query({
      name: 'FilteredTodoKeyListQuery',
      impl: ({ get }) => {
        const filter = get(todoFooter.query.TodoFilterQuery())

        if (filter === 'all') {
          return get(todoList.query.TodoListQuery()).map(getTodoId)
        }

        if (filter === 'active') {
          return get(todoList.query.ActiveTodoListQuery()).map(getTodoId)
        }

        if (filter === 'completed') {
          return get(todoList.query.CompletedTodoListQuery()).map(getTodoId)
        }

        throw new Error(`Unknown filter: ${filter}`)
      },
    })

    const ClearTodoInputCommand$ = domain.command$({
      name: 'ClearTodoInputCommand$',
      impl: ({ fromEvent, get }) => {
        return fromEvent(todoList.event.TodoItemAddedEvent).pipe(
          filter((todo) => {
            const todoInput = get(todoHeader.query.TodoInputQuery())
            return todoInput === todo.title
          }),
          map(() => todoHeader.command.ClearTodoInputCommand()),
        )
      },
    })

    domain.ignite(() => ClearTodoInputCommand$())

    return {
      query: {
        FilteredTodoKeyListQuery,
      }
    }
  },
})
