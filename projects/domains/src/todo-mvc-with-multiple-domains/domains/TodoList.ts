import { Remesh } from 'remesh'
import { ListModule } from 'remesh/modules/list'

import { uuid } from '../utils/uuid'
import { syncStorage } from '../domain-modules/sync-storage'

export const TODO_LIST_STORAGE_KEY = 'remesh-example/todo-list'

export type Todo = {
  id: string
  title: string
  completed: boolean
}

export type Todos = Todo[]

export const getTodoId = (todo: Todo) => todo.id

export const TodoListDomain = Remesh.domain({
  name: 'TodoListDomain',
  impl: (domain) => {
    const TodoListModule = ListModule<Todo>(domain, {
      name: 'TodoListModule',
      key: getTodoId,
    })

    const TodoListQuery = TodoListModule.query.ItemListQuery

    const TodoQuery = TodoListModule.query.ItemQuery

    const TodoKeyListQuery = TodoListModule.query.KeyListQuery

    const TodoListChangedEvent = domain.event({
      name: 'TodoListChangedEvent',
      impl: ({ get }) => {
        return get(TodoListQuery())
      },
    })

    const SetTodoListCommand = domain.command({
      name: 'SetTodoListCommand',
      impl: ({}, todos: Todos) => {
        return [TodoListModule.command.SetListCommand(todos), TodoListChangedEvent()]
      },
    })

    const FailedToAddTodoEvent = domain.event<{ reason: string }>({
      name: 'FailedToAddTodoEvent',
    })

    const TodoItemAddedEvent = domain.event<Todo>({
      name: 'TodoItemAddedEvent',
    })

    const AddTodoCommand = domain.command({
      name: 'AddTodoCommand',
      impl: ({}, title: string) => {
        if (title === '') {
          return FailedToAddTodoEvent({
            reason: 'Title cannot be empty',
          })
        }

        const todo: Todo = {
          id: uuid(),
          title: title,
          completed: false,
        }

        return [TodoListModule.command.AddItemCommand(todo), TodoItemAddedEvent(todo), TodoListChangedEvent()]
      },
    })

    const UpdateTodoCommand = domain.command({
      name: 'UpdateTodoCommand',
      impl: ({}, todo: Todo) => {
        if (todo.title === '') {
          return DeleteTodoCommand(todo.id)
        }

        return [TodoListModule.command.UpdateItemCommand(todo), TodoListChangedEvent()]
      },
    })

    const DeleteTodoCommand = domain.command({
      name: 'DeleteTodoCommand',
      impl: ({}, id: string) => {
        return [TodoListModule.command.DeleteItemCommand(id), TodoListChangedEvent()]
      },
    })

    const ActiveTodoListQuery = domain.query({
      name: 'ActiveTodoListQuery',
      impl: ({ get }) => {
        const todos = get(TodoListQuery())
        return todos.filter((todo) => !todo.completed)
      },
    })

    const CompletedTodoListQuery = domain.query({
      name: 'CompletedTodoListQuery',
      impl: ({ get }) => {
        const todos = get(TodoListQuery())
        return todos.filter((todo) => todo.completed)
      },
    })

    const ActiveTodoCountQuery = domain.query({
      name: 'ActiveTodoCountQuery',
      impl: ({ get }) => {
        const todos = get(ActiveTodoListQuery())
        return todos.length
      },
    })

    const CompletedTodoCountQuery = domain.query({
      name: 'CompletedTodoCountQuery',
      impl: ({ get }) => {
        const todos = get(CompletedTodoListQuery())
        return todos.length
      },
    })

    const IsAllCompletedQuery = domain.query({
      name: 'IsAllCompletedQuery',
      impl: ({ get }) => {
        const todos = get(TodoListQuery())

        if (todos.length === 0) {
          return false
        }

        const completedTodoCount = get(CompletedTodoCountQuery())

        return completedTodoCount === todos.length
      },
    })

    const ToggleTodoCommand = domain.command({
      name: 'ToggleTodoCommand',
      impl: ({ get }, id: Todo['id']) => {
        const todo = get(TodoQuery(id))
        const newTodo: Todo = {
          ...todo,
          completed: !todo.completed,
        }

        return UpdateTodoCommand(newTodo)
      },
    })

    const ToggleAllCommand = domain.command({
      name: 'ToggleAllCommand',
      impl: ({ get }) => {
        const todoList = get(TodoListQuery())

        if (todoList.length === 0) {
          return null
        }

        const activeCount = get(ActiveTodoCountQuery())
        const completed = activeCount > 0
        const newTodoList = todoList.map((todo) => ({
          ...todo,
          completed,
        }))

        return SetTodoListCommand(newTodoList)
      },
    })

    const ClearAllCompletedCommand = domain.command({
      name: 'ClearAllCompletedCommand',
      impl: ({ get }) => {
        const todoList = get(TodoListQuery())

        if (todoList.length === 0) {
          return null
        }

        const newTodoList = todoList.filter((todo) => !todo.completed)

        return SetTodoListCommand(newTodoList)
      },
    })

    syncStorage(domain, TODO_LIST_STORAGE_KEY)
      .listenTo(TodoListChangedEvent)
      .set(({}, todos) => {
        return SetTodoListCommand(todos)
      })

    return {
      query: {
        TodoQuery,
        TodoKeyListQuery,
        TodoListQuery,
        ActiveTodoListQuery,
        CompletedTodoListQuery,
        ActiveTodoCountQuery,
        CompletedTodoCountQuery,
        IsAllCompletedQuery,
      },
      command: {
        SetTodoListCommand,
        AddTodoCommand,
        UpdateTodoCommand,
        DeleteTodoCommand,
        ToggleTodoCommand,
        ToggleAllCommand,
        ClearAllCompletedCommand,
      },
      event: {
        FailedToAddTodoEvent,
        TodoListChangedEvent,
        TodoItemAddedEvent,
      },
    }
  },
})
