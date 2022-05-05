import { Remesh } from 'remesh'

import { filter, map } from 'rxjs/operators'

import { TodoInputDomain } from './TodoInput'
import { TodoListDomain, getTodoId } from './TodoList'
import { TodoFilterDomain } from './TodoFilter'

export const TodoAppDomain = Remesh.domain({
  name: 'TodoApp',
  impl: (domain) => {
    const todoHeader = domain.getDomain(TodoInputDomain())
    const todoList = domain.getDomain(TodoListDomain())
    const todoFooter = domain.getDomain(TodoFilterDomain())

    const FilteredTodoKeyListQuery = domain.query({
      name: 'FilteredTodoList',
      impl: ({ get }) => {
        const filter = get(todoFooter.query.todoFilter())

        if (filter === 'all') {
          return get(todoList.query.todoList()).map(getTodoId)
        }

        if (filter === 'active') {
          return get(todoList.query.activeTodoList()).map(getTodoId)
        }

        if (filter === 'completed') {
          return get(todoList.query.completedTodoList()).map(getTodoId)
        }

        throw new Error(`Unknown filter: ${filter}`)
      },
    })

    const clearTodoInputWhenSubmit = domain.command$({
      name: 'clearTodoInputWhenSubmit',
      impl: ({ fromEvent, get }) => {
        return fromEvent(todoList.event.TodoItemAddedEvent).pipe(
          filter((todo) => {
            const todoInput = get(todoHeader.query.todoInput())
            return todoInput === todo.title
          }),
          map(() => todoHeader.command.clearTodoInput()),
        )
      },
    })

    domain.ignite(() => clearTodoInputWhenSubmit())

    return {
      query: {
        FilteredTodoKeyListQuery,
      },
      command: {},
      event: {},
    }
  },
})
