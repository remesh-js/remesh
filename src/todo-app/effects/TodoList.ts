import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../remesh"

import {
    removeTodo,
    toggleTodo,
    updateTodo,
    UpdateTodoPayload
} from "../models/todosList"

export const UserToggleTodoEvent = Remesh.event<number>({
    name: 'UserToggleTodoEvent'
})

export const UserUpdateTodoEvent = Remesh.event<UpdateTodoPayload>({
    name: 'UserUpdateTodoEvent'
})

export const UserRemoveTodoEvent = Remesh.event<number>({
    name: 'UserRemoveTodoEvent'
})

export const TodoListEffect = Remesh.effect({
    name: 'TodoListEffect',
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