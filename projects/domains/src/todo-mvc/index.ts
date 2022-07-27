import { Remesh } from 'remesh'
import { from, map, merge, tap } from 'rxjs'
import { uuid } from './uuid'
import { TodoRepoExtern } from './todo-repo'

export type Todo = {
  id: string
  name: string
  completed: boolean
}

export const TodoDomain = Remesh.domain({
  name: 'TodoDomain',
  impl: (domain) => {
    const repo = domain.getExtern(TodoRepoExtern)

    const TodoListState = domain.state<Todo[]>({
      name: 'TodoListState',
      default: [],
    })

    const TodoListQuery = domain.query({
      name: 'TodoListQuery',
      impl({ get }, status?: 'completed' | 'active') {
        const todoList = get(TodoListState())
        if (status === 'active') {
          return todoList.filter((todo) => !todo.completed)
        } else if (status === 'completed') {
          return todoList.filter((todo) => todo.completed)
        } else {
          return todoList
        }
      },
    })

    const HasCompletedQuery = domain.query({
      name: 'HasCompletedQuery',
      impl({ get }) {
        return get(TodoListQuery('completed')).length > 0
      },
    })

    const ActiveTodoCountQuery = domain.query({
      name: 'ActiveTodoCountQuery',
      impl({ get }) {
        return get(TodoListQuery('active')).length
      },
    })

    const AllCompletedQuery = domain.query({
      name: 'AllCompletedQuery',
      impl({ get }) {
        return get(ActiveTodoCountQuery()) === 0 && get(TodoListQuery()).length > 0
      },
    })

    const TodoAddedEvent = domain.event<Todo>({
      name: 'TodoAddedEvent',
    })

    const SetTodoListCommand = domain.command({
      name: 'SetTodoListCommand',
      impl(_, todoList: Todo[]) {
        return TodoListState().new(todoList)
      },
    })

    const AddTodoFailedEvent = domain.event<string>({
      name: 'AddTodoFailedEvent',
    })

    const AddTodoCommand = domain.command({
      name: 'AddTodoCommand',
      impl({ get }, todoName: string) {
        if (todoName.trim() === '') {
          return [AddTodoFailedEvent('Cannot be empty, please enter the TODO name')]
        }

        const todoList = get(TodoListState())
        const newTodo = {
          id: uuid(),
          name: todoName,
          completed: false,
        }

        return [TodoListState().new([...todoList, newTodo]), TodoAddedEvent(newTodo)]
      },
    })

    const RemoveTodoEvent = domain.event<Todo['id'][]>({
      name: 'RemoveTodoEvent',
    })

    const RemoveTodoCommand = domain.command({
      name: 'RemoveTodoCommand',
      impl({ get }, id: Todo['id']) {
        const todoList = get(TodoListState())
        const newTodoList = todoList.filter((todo) => todo.id !== id)

        return [TodoListState().new(newTodoList), RemoveTodoEvent([id])]
      },
    })

    const TodoUpdatedEvent = domain.event<Todo>({
      name: 'TodoUpdatedEvent',
    })

    const UpdateTodoCommand = domain.command({
      name: 'UpdateTodoCommand',
      impl({ get }, payload: { id: Todo['id'] } & Partial<Todo>) {
        const todoList = get(TodoListState())

        if (payload.name && payload.name.trim() === '') {
          return RemoveTodoCommand(payload.id)
        }

        const newTodoList = todoList.map((todo) => {
          if (todo.id === payload.id) {
            return {
              ...todo,
              ...payload,
              id: todo.id,
            }
          } else {
            return todo
          }
        })

        const targetTodo = newTodoList.find((todo) => todo.id === payload.id)

        if (!targetTodo) {
          return null
        }

        return [TodoListState().new(newTodoList), TodoUpdatedEvent(targetTodo)]
      },
    })

    const TodoCompletedChangedEvent = domain.event<{ ids: Todo['id'][]; completed: boolean }>({
      name: 'TodoCompletedChangedEvent',
    })

    const ToggleTodoCompletedCommand = domain.command({
      name: 'ToggleTodoCompletedCommand',
      impl({ get }, targetTodoId: Todo['id']) {
        const todoList = get(TodoListState())

        const newTodoList = todoList.map((todo) => {
          if (todo.id === targetTodoId) {
            return {
              ...todo,
              completed: !todo.completed,
            }
          }
          return todo
        })

        const targetTodo = newTodoList.find((todo) => todo.id === targetTodoId)

        if (!targetTodo) {
          return null
        }

        const eventData = {
          ids: [targetTodoId],
          completed: targetTodo?.completed,
        }

        return [TodoListState().new(newTodoList), TodoCompletedChangedEvent(eventData)]
      },
    })

    const ToggleAllTodoCompletedCommand = domain.command({
      name: 'ToggleAllTodoCompletedCommand',
      impl({ get }, completed: boolean) {
        const todoList = get(TodoListState())

        if (todoList.length === 0) {
          return null
        }

        const newTodoList = todoList.map((todo) => {
          return { ...todo, completed }
        })

        return [
          TodoListState().new(newTodoList),
          TodoCompletedChangedEvent({
            ids: newTodoList.map((todo) => todo.id),
            completed,
          }),
        ]
      },
    })

    const ClearCompletedCommand = domain.command({
      name: 'ClearCompletedCommand',
      impl({ get }) {
        const todoList = get(TodoListState())
        const newTodoList = todoList.filter((todo) => !todo.completed)
        const removedTodoIdList = todoList.filter((todo) => todo.completed).map((todo) => todo.id)

        return [TodoListState().new(newTodoList), RemoveTodoEvent(removedTodoIdList)]
      },
    })

    domain.effect({
      name: 'FromRepoToStateEffect',
      impl() {
        return from(repo.getTodoList()).pipe(map((todos) => SetTodoListCommand(todos)))
      },
    })

    domain.effect({
      name: 'FromStateToRepoEffect',
      impl: ({ fromEvent }) => {
        const addTodo$ = fromEvent(TodoAddedEvent).pipe(tap((todo) => repo.addTodo(todo)))

        const removeTodo$ = fromEvent(RemoveTodoEvent).pipe(tap((ids) => repo.removeTodoByIds(ids)))

        const updateTodo$ = fromEvent(TodoUpdatedEvent).pipe(tap((todo) => repo.updateTodo(todo)))

        const toggleTodoCompleted$ = fromEvent(TodoCompletedChangedEvent).pipe(
          tap((eventData) => repo.toggleCompletedByIds(eventData.ids, eventData.completed)),
        )

        return merge(addTodo$, removeTodo$, updateTodo$, toggleTodoCompleted$).pipe(map(() => null))
      },
    })

    return {
      query: {
        TodoListQuery,
        ActiveTodoCountQuery,
        HasCompletedQuery,
        AllCompletedQuery,
      },
      command: {
        AddTodoCommand,
        RemoveTodoCommand,
        ToggleTodoCompletedCommand,
        ToggleAllTodoCompletedCommand,
        UpdateTodoCommand,
        ClearCompletedCommand,
      },
      event: { AddTodoFailedEvent },
    }
  },
})
