import { map } from 'rxjs/operators'
import { Remesh, RemeshEventItem } from '../../remesh'

import { ListWidget } from '../../remesh/widgets/list'

import { merge, of } from 'rxjs'

export type Todo = {
    id: string
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
    todoId: string
    content: string
}

export const TodoListDomain = Remesh.domain({
    name: 'TodoListDomain',
    impl: domain => {

        const listWidget = domain.use(ListWidget({
            name: 'TodoList',
            getKey: (todo: Todo) => {
                return todo.id
            },
            createItem: (todoId): Todo => {
                return {
                    id: todoId,
                    content: '',
                    completed: false
                }
            }
        }))

        const AddTodoFailedEvent = domain.event<AddTodoFailedEventData>({
            name: 'AddTodoFailedEvent'
        })

        const AddTodoSuccessEvent = domain.event<AddTodoSucceededEventData>({
            name: 'AddTodoSuccessEvent'
        })

        let todoUid = 0

        const addTodo = domain.command({
            name: 'addTodo',
            impl: ({ emit }, todoContent: string) => {
                if (todoContent.length === 0) {
                    return emit(AddTodoFailedEvent({
                        message: `Unexpected empty todo input`
                    }))
                }

                const newTodo: Todo = {
                    id: todoUid++ + '',
                    content: todoContent,
                    completed: false
                }

                return [
                    emit(listWidget.event.addItem(newTodo)),
                    emit(AddTodoSuccessEvent({ newTodo }))
                ]
            }
        })


        const updateTodo = domain.command({
            name: 'updateTodo',
            impl: ({ query, emit }, payload: UpdateTodoPayload) => {
                if (payload.content.length === 0) {
                    return emit(listWidget.event.removeItem(payload.todoId))
                }

                const todo = query(listWidget.query.ItemQuery(payload.todoId))

                return emit(listWidget.event.updateItem({
                    ...todo,
                    content: payload.content
                }))
            }
        })

        const toggleTodo = domain.command({
            name: 'toggleTodo',
            impl: ({ query, emit }, todoId: string) => {
                const todo = query(listWidget.query.ItemQuery(todoId))

                return emit(listWidget.event.updateItem({
                    ...todo,
                    completed: !todo.completed
                }))
            }
        })

        const toggleAllTodos = domain.command({
            name: 'toggleAllTodos',
            impl: ({ get, set, emit, query }) => {
                const isAllCompleted = query(IsAllCompletedQuery())
                const todoList = query(listWidget.query.ItemListQuery())

                return todoList.map(todo => {
                    return emit(listWidget.event.updateItem({
                        ...todo,
                        completed: !isAllCompleted
                    }))
                })
            }
        })

        const TodoSortedListQuery = domain.query({
            name: 'TodoSortedListQuery',
            impl: ({ query }) => {
                const todoList = query(listWidget.query.ItemListQuery())
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
            impl: ({ query }) => {
                const { activeTodoList, completedTodoList } = query(TodoSortedListQuery())

                return activeTodoList.length === 0 && completedTodoList.length > 0
            }
        })

        const TodoItemLeftCountQuery = domain.query({
            name: 'TodoItemLeftCountQuery',
            impl: ({ query }) => {
                const { activeTodoList } = query(TodoSortedListQuery())
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

                return merge(
                    addTodo$,
                    updateTodo$,
                    toggleAllTodos$,
                    toggleTodo$
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
                SetTodoListEvent: listWidget.event.setLIst,
                AddTodoEvent: addTodo.Event,
                ToggleAllTodosEvent: toggleAllTodos.Event,
                UpdateTodoEvent: updateTodo.Event,
                RemoveTodoEvent: listWidget.event.removeItem,
                ToggleTodoEvent: toggleTodo.Event
            },
            query: {
                TodoKeyListQuery: listWidget.query.KeyListQuery,
                TodoListQuery: listWidget.query.ItemListQuery,
                IsAllCompletedQuery,
                TodoSortedListQuery,
                TodoItemLeftCountQuery,
                TodoItemQuery: listWidget.query.ItemQuery
            }
        }
    }
})

export const TodoListExtern = Remesh.extern({
    name: 'TodoListExtern',
    default: [] as Todo[],
    impl: ({ getEvent }, todos: Todo[]) => {
        return {
            preload: (): RemeshEventItem<Todo[]> => {
                return getEvent(TodoListDomain).SetTodoListEvent(todos)
            }
        }
    }
})