import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"

import { removeTodo, TodoListState, TodoSortedListQuery, toggleTodo, updateTodo, UpdateTodoPayload } from "../entity/todos"

import { TodoFilterState } from "../entity/todoFilter"
import { TodoInputState } from "../entity/todoInput"

export const UserToggleTodoEvent = Remesh.event<number>({
    name: 'UserToggleTodoEvent'
})

export const UserUpdateTodoEvent = Remesh.event<UpdateTodoPayload>({
    name: 'UserUpdateTodoEvent'
})

export const UserRemoveTodoEvent = Remesh.event<number>({
    name: 'UserRemoveTodoEvent'
})

export const TodoFilteredListQuery = Remesh.query({
    name: 'TodoFilteredListQuery',
    impl: ({ get }) => {
        const todoList = get(TodoListState)
        const todoSortedList = get(TodoSortedListQuery)
        const todoFilter = get(TodoFilterState)

        if (todoFilter === 'active') {
            return todoSortedList.activeTodoList
        }

        if (todoFilter === 'completed') {
            return todoSortedList.completedTodoList
        }

        return todoList
    }
})

export const TodoMatchedListQuery = Remesh.query({
    name: 'TodoMatchedListQuery',
    impl: ({ get }) => {
        const todoFilteredList = get(TodoFilteredListQuery)
        const todoInput = get(TodoInputState)

        if (todoInput.length === 0) {
            return todoFilteredList
        }

        const todoMatchedList = todoFilteredList.filter(todo => {
            return todo.content.includes(todoInput)
        })

        return todoMatchedList
    }
})

export const TodoListAggregate = Remesh.aggregate({
    name: 'TodoListAggregate',
    impl: ({ fromEvent }) => {
        const toggleTodo$ = fromEvent(UserToggleTodoEvent).pipe(
            map(todoId => toggleTodo(todoId))
        )

        const updateTodo$ = fromEvent(UserUpdateTodoEvent).pipe(
            map(updateTodoPayload => updateTodo(updateTodoPayload))
        )

        const removeTodo$ = fromEvent(UserRemoveTodoEvent).pipe(
            map(todoId => removeTodo(todoId))
        )

        return merge(toggleTodo$, updateTodo$, removeTodo$)
    }
})