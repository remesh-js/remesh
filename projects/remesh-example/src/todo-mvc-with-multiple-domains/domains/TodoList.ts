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
  name: 'TodoList',
  impl: (domain) => {
    const todoListModule = ListModule<Todo>(domain, {
      name: 'TodoList',
      key: getTodoId,
    })

    const TodoListQuery = todoListModule.query.ItemListQuery

    const TodoQuery = todoListModule.query.ItemQuery

    const TodoKeyListQuery = todoListModule.query.KeyListQuery

    const TodoListChangedEvent = todoListModule.event.ListChangedEvent

    const TodoItemAddedEvent = todoListModule.event.ItemAddedEvent

    const TodoItemUpdatedEvent = todoListModule.event.ItemUpdatedEvent

    const TodoItemDeletedEvent = todoListModule.event.ItemDeletedEvent

    const FailedToAddTodoEvent = todoListModule.event.FailedToAddItemEvent

    const FailedToUpdateTodoEvent = todoListModule.event.FailedToUpdateItemEvent

    const setTodoList = todoListModule.command.setList

    const addTodo = domain.command({
      name: 'TodoList.addTodo',
      impl: (_, title: string) => {
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

        return todoListModule.command.addItem(todo)
      },
    })

    const updateTodo = domain.command({
      name: 'TodoList.updateTodo',
      impl: (_, todo: Todo) => {
        if (todo.title === '') {
          return deleteTodo(todo.id)
        }
        return todoListModule.command.updateItem(todo)
      }
    })

    const deleteTodo = todoListModule.command.deleteItem

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

    const toggleTodo = domain.command({
      name: 'toggleTodo',
      impl: ({ get }, id: Todo['id']) => {
        const todo = get(TodoQuery(id))
        const newTodo: Todo = {
          ...todo,
          completed: !todo.completed,
        }

        return todoListModule.command.updateItem(newTodo)
      },
    })

    const toggleAllTodos = domain.command({
      name: 'toggleAllTodos',
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

        return setTodoList(newTodoList)
      },
    })

    const clearAllCompletedTodos = domain.command({
      name: 'clearAllCompletedTodos',
      impl: ({ get }) => {
        const todoList = get(TodoListQuery())

        if (todoList.length === 0) {
          return null
        }

        const newTodoList = todoList.filter((todo) => !todo.completed)

        return setTodoList(newTodoList)
      },
    })

    syncStorage(domain, TODO_LIST_STORAGE_KEY)
      .listenTo(TodoListChangedEvent)
      .saveData((event) => event.current)
      .readData((todos) => setTodoList(todos))

    return {
      query: {
        TodoQuery,
        TodoKeyListQuery,
        TodoListQuery,
        ActiveTodoListQuery,
        CompletedTodoListQuery,
        ActiveTodoCountQuery,
        CompletedTodoCountQuery,
        IsAllCompletedQuery
      },
      command: {
        setTodoList,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        toggleAllTodos,
        clearAllCompletedTodos,
      },
      event: {
        TodoItemAddedEvent,
        TodoItemUpdatedEvent,
        TodoItemDeletedEvent,
        FailedToAddTodoEvent,
        FailedToUpdateTodoEvent,
        TodoListChangedEvent,
      },
    }
  },
})
