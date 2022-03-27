import { Remesh } from 'remesh'
import { from, map, Observable, of, switchMap } from 'rxjs'
import { uuid } from './uuid'
import { TodoRepoExtern } from './todoRepo'

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
      name: 'TodoList',
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
        const todoList = get(TodoListState())
        return todoList.filter((todo) => !todo.completed).length
      },
    })

    const AllCompletedQuery = domain.query({
      name: 'AllCompletedQuery',
      impl({ get }) {
        return !get(TodoListState()).some((todo) => todo.completed === false)
      },
    })

    const addTodoEvent = domain.event({
      name: 'addTodoEvent',
      impl(_, todo: Todo) {
        repo.addTodo(todo)
      },
    })

    const resetTodoList = domain.command({
      name: 'resetTodoList',
      impl(_, todoList: Todo[]) {
        return TodoListState().new(todoList)
      },
    })

    const addTodoFailEvent = domain.event({
      name: 'addTodoFailEvent',
    })

    const addTodo = domain.command({
      name: 'addTodo',
      impl({ get }, todoName: string) {
        if (todoName.trim() === '') {
          return [addTodoFailEvent()]
        }

        const todoList = get(TodoListState())
        const newTodo = { name: todoName, completed: false, id: uuid() }

        return [TodoListState().new([newTodo, ...todoList]), addTodoEvent(newTodo)]
      },
    })

    const removeTodoEvent = domain.event({
      name: 'removeTodoEvent',
      impl(_, ids: Todo['id'][]) {
        repo.removeTodoByIds(ids)
      },
    })

    const removeTodo = domain.command({
      name: 'removeTodo',
      impl({ get }, id: Todo['id']) {
        const todoList = get(TodoListState())
        return [TodoListState().new(todoList.filter((todo) => todo.id !== id)), removeTodoEvent([id])]
      },
    })

    const updateTodoEvent = domain.event({
      name: 'updateTodoEvent',
      impl(_, todo: Todo) {
        repo.updateTodo(todo)
      },
    })

    const updateTodo = domain.command({
      name: 'updateTodo',
      impl({ get }, updateTodo: Todo) {
        const todoList = get(TodoListState())
        if (updateTodo.name.trim() === '') {
          return removeTodo(updateTodo.id)
        }
        return [
          TodoListState().new(todoList.map((todo) => (todo.id === updateTodo.id ? { ...todo, ...updateTodo } : todo))),
          updateTodoEvent(updateTodo),
        ]
      },
    })

    const toggleTodoCompletedEvent = domain.event({
      name: 'toggleAllTodoCompletedEvent',
      impl(_, payload: { ids: Todo['id'][]; completed: boolean }) {
        repo.toggleCompletedByIds(payload.ids, payload.completed)
      },
    })

    const toggleTodoCompleted = domain.command({
      name: 'toggleTodoCompleted',
      impl({ get }, payload: { id: Todo['id']; completed: Todo['completed'] }) {
        const { id, completed } = payload
        const todoList = get(TodoListState())
        return [
          TodoListState().new(todoList.map((todo) => (todo.id === id ? { ...todo, completed } : todo))),
          toggleTodoCompletedEvent({
            ids: [id],
            completed: completed,
          }),
        ]
      },
    })

    const toggleAllTodoCompleted = domain.command({
      name: 'toggleAllTodoCompleted',
      impl({ get }, completed: boolean) {
        const todoList = get(TodoListState())
        return [
          TodoListState().new(
            todoList.map((todo) => {
              return { ...todo, completed }
            }),
          ),
          toggleTodoCompletedEvent({
            ids: todoList.map((todo) => todo.id),
            completed,
          }),
        ]
      },
    })

    const clearCompleted = domain.command({
      name: 'clearCompleted',
      impl({ get }) {
        const todoList = get(TodoListState())
        return [
          TodoListState().new(todoList.filter((todo) => !todo.completed)),
          removeTodoEvent(todoList.filter((item) => item.completed).map((todo) => todo.id)),
        ]
      },
    })

    const fetchTodoList = domain.command$({
      name: 'fetchTodoList',
      impl(_, payload$: Observable<void>) {
        return payload$.pipe(
          switchMap(() => from(repo.getTodoList())),
          map((todos) => resetTodoList(todos)),
        )
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
        addTodo,
        removeTodo,
        toggleTodoCompleted,
        toggleAllTodoCompleted,
        updateTodo,
        clearCompleted,
        fetchTodoList,
      },
      event: { addTodoFailEvent }
    }
  },
})
