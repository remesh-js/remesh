import { map } from 'rxjs/operators'
import { Remesh, RemeshEventPayload } from '../../remesh'

import { merge, of } from 'rxjs'

export type Todo = {
    id: number
    content: string
    completed: boolean
}

export type AddTodoFailedEventData = {
    message: string
}

export type AddTodoSucceededEventData = {
    newTodo: Todo
}


export type UpdateTodoPayload = {
    todoId: number
    content: string
}

export const TodoListDomain = Remesh.domain({
    name: 'TodoListDomain',
    impl: domain => {
        const TodoListState = domain.state<Todo[]>({
            name: 'TodoListState',
            default: []
        })

        const AddTodoFailedEvent = domain.event<AddTodoFailedEventData>({
            name: 'AddTodoFailedEvent'
        })

        const AddTodoSuccessEvent = domain.event<AddTodoSucceededEventData>({
            name: 'AddTodoSuccessEvent'
        })

        const setTodoList = domain.command({
            name: 'setTodos',
            impl: ({ }, todos: Todo[]) => {
                return TodoListState(todos)
            }
        })

        let todoUid = 0

        const addTodo = domain.command({
            name: 'addTodo',
            impl: ({ get }, todoContent: string) => {
                const todoList = get(TodoListState)

                if (todoContent.length === 0) {
                    return AddTodoFailedEvent({
                        message: `Unexpected empty todo input`
                    })
                }

                const newTodo: Todo = {
                    id: todoUid++,
                    content: todoContent,
                    completed: false
                }

                const newTodoList = todoList.concat(newTodo)

                return [
                    TodoListState(newTodoList),
                    AddTodoSuccessEvent({ newTodo })
                ]
            }
        })

        const removeTodo = domain.command({
            name: 'removeTodo',
            impl: ({ get }, todoId: number) => {
                const todoList = get(TodoListState)
                const newTodoList = todoList.filter(todo => todo.id !== todoId)

                return TodoListState(newTodoList)
            }
        })


        const updateTodo = domain.command({
            name: 'updateTodo',
            impl: ({ get }, payload: UpdateTodoPayload) => {
                if (payload.content.length === 0) {
                    return removeTodo(payload.todoId)
                }

                const todoList = get(TodoListState)
                const newTodoList = todoList.map(todo => {
                    if (todo.id !== payload.todoId) {
                        return todo
                    }
                    return {
                        ...todo,
                        content: payload.content
                    }
                })

                return TodoListState(newTodoList)
            }
        })

        const toggleTodo = domain.command({
            name: 'toggleTodo',
            impl: ({ get }, todoId: number) => {
                const todoList = get(TodoListState)
                const newTodoList = todoList.map(todo => {
                    if (todo.id !== todoId) {
                        return todo
                    }
                    return {
                        ...todo,
                        completed: !todo.completed
                    }
                })

                return TodoListState(newTodoList)
            }
        })

        const toggleAllTodos = domain.command({
            name: 'toggleAllTodos',
            impl: ({ get }) => {
                const todoList = get(TodoListState)
                const isAllCompleted = get(IsAllCompletedQuery())

                const newTodoList = todoList.map(todo => {
                    return {
                        ...todo,
                        completed: !isAllCompleted
                    }
                })

                return TodoListState(newTodoList)
            }
        })

        const TodoListQuery = domain.query({
            name: 'TodoListQuery',
            impl: ({ get }) => {
                return get(TodoListState)
            }
        })

        const TodoSortedListQuery = domain.query({
            name: 'TodoSortedListQuery',
            impl: ({ get }) => {
                const todoList = get(TodoListState)
                const activeTodoList: Todo[] = []
                const completedTodoList: Todo[] = []

                for (const todo of todoList) {
                    if (todo.completed) {
                        completedTodoList.push(todo)
                    } else {
                        activeTodoList.push(todo)
                    }
                }

                return {
                    activeTodoList,
                    completedTodoList
                }
            }
        })

        const IsAllCompletedQuery = domain.query({
            name: 'IsAllCompletedQuery',
            impl: ({ get }) => {
                const { activeTodoList, completedTodoList } = get(TodoSortedListQuery())

                return activeTodoList.length === 0 && completedTodoList.length > 0
            }
        })

        const TodoItemLeftCountQuery = domain.query({
            name: 'TodoItemLeftCountQuery',
            impl: ({ get }) => {
                const { activeTodoList } = get(TodoSortedListQuery())
                return activeTodoList.length
            }
        })

        const TodoListAutorunTask = domain.task({
            name: 'TodoListAutorunTask',
            impl: ({ fromEvent }) => {
                const addTodo$ = fromEvent(addTodo.Event).pipe(
                    map(todoContent => addTodo(todoContent))
                )

                const toggleAllTodos$ = fromEvent(toggleAllTodos.Event).pipe(
                    map(() => toggleAllTodos())
                )

                const toggleTodo$ = fromEvent(toggleTodo.Event).pipe(
                    map(todoId => toggleTodo(todoId))
                )

                const updateTodo$ = fromEvent(updateTodo.Event).pipe(
                    map(updateTodoPayload => updateTodo(updateTodoPayload))
                )

                const removeTodo$ = fromEvent(removeTodo.Event).pipe(
                    map(todoId => removeTodo(todoId))
                )

                const setTodoList$ = fromEvent(setTodoList.Event).pipe(
                    map(todoList => setTodoList(todoList))
                )

                return merge(
                    addTodo$,
                    updateTodo$,
                    removeTodo$,
                    toggleAllTodos$,
                    toggleTodo$,
                    setTodoList$
                )
            }
        })

        const TodoListPreloadTask = domain.task({
            name: 'TodoListPreloadTask',
            impl: ({ getExtern }) => {
                const todoListExtern = getExtern(TodoListExtern)
                return of(todoListExtern.preload())
            }
        })

        return {
            autorun: [TodoListAutorunTask, TodoListPreloadTask],
            event: {
                AddTodoFailedEvent,
                AddTodoSuccessEvent,
                SetTodoListEvent: setTodoList.Event,
                AddTodoEvent: addTodo.Event,
                ToggleAllTodosEvent: toggleAllTodos.Event,
                UpdateTodoEvent: updateTodo.Event,
                RemoveTodoEvent: removeTodo.Event,
                ToggleTodoEvent: toggleTodo.Event
            },
            query: {
                TodoListQuery,
                IsAllCompletedQuery,
                TodoSortedListQuery,
                TodoItemLeftCountQuery
            }
        }
    }
})

export const TodoListExtern = Remesh.extern({
    name: 'TodoListExtern',
    default: [] as Todo[],
    impl: ({ getEvent }, todos: Todo[]) => {
        return {
            preload: (): RemeshEventPayload<Todo[]> => {
                return getEvent(TodoListDomain).SetTodoListEvent(todos)
            }
        }
    }
})