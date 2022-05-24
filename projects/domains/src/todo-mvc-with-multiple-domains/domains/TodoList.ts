import { Remesh } from 'remesh'
import { ListModule } from 'remesh/modules/list'

import { uuid } from '../utils/uuid'
import { syncStorage } from '../domain-modules/sync-storage'
import { map } from 'rxjs/operators'

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
    const todoListModule = ListModule<Todo>(domain, {
      name: 'TodoList',
      key: getTodoId,
    })

    const TodoListQuery = todoListModule.query.ItemListQuery

    const TodoQuery = todoListModule.query.ItemQuery

    const TodoKeyListQuery = todoListModule.query.KeyListQuery

    const TodoListChangedEvent = domain.event({
      name: 'TodoListChangedEvent',
      impl: ({ get }, arg$) => {
        return arg$.pipe(map(() => get(TodoListQuery())))
      },
    })

    const SetTodoListCommand = domain.command({
      name: 'SetTodoListCommand',
      impl: ({ send, emit }, todos: Todos) => {
        send(todoListModule.command.SetListCommand(todos))
        emit(TodoListChangedEvent())
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
      impl: ({ send, emit }, title: string) => {
        if (title === '') {
          emit(
            FailedToAddTodoEvent({
              reason: 'Title cannot be empty',
            }),
          )
          return
        }

        const todo: Todo = {
          id: uuid(),
          title: title,
          completed: false,
        }

        send(todoListModule.command.AddItemCommand(todo))
        emit(TodoItemAddedEvent(todo))
        emit(TodoListChangedEvent())
      },
    })

    const UpdateTodoCommand = domain.command({
      name: 'UpdateTodoCommand',
      impl: ({ send, emit }, todo: Todo) => {
        if (todo.title === '') {
          send(DeleteTodoCommand(todo.id))
          return
        }

        send(todoListModule.command.UpdateItemCommand(todo))
        emit(TodoListChangedEvent())
      },
    })

    const DeleteTodoCommand = domain.command({
      name: 'DeleteTodoCommand',
      impl: ({ send, emit }, id: string) => {
        send(todoListModule.command.DeleteItemCommand(id))
        emit(TodoListChangedEvent())
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
      impl: ({ get, send }, id: Todo['id']) => {
        const todo = get(TodoQuery(id))
        const newTodo: Todo = {
          ...todo,
          completed: !todo.completed,
        }

        send(UpdateTodoCommand(newTodo))
      },
    })

    const ToggleAllCommand = domain.command({
      name: 'ToggleAllCommand',
      impl: ({ get, send }) => {
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

        send(SetTodoListCommand(newTodoList))
      },
    })

    const ClearAllCompletedCommand = domain.command({
      name: 'ClearAllCompletedCommand',
      impl: ({ get, send }) => {
        const todoList = get(TodoListQuery())

        if (todoList.length === 0) {
          return null
        }

        const newTodoList = todoList.filter((todo) => !todo.completed)

        send(SetTodoListCommand(newTodoList))
      },
    })

    syncStorage(domain, TODO_LIST_STORAGE_KEY)
      .listenTo(TodoListChangedEvent)
      .set(({ send }, todos) => {
        send(SetTodoListCommand(todos))
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
