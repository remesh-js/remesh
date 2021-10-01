import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"
import { UserRemoveTodoEvent, UserToggleTodoEvent, UserUpdateTodoEvent } from "../event"
import { removeTodo, toggleTodo, updateTodo } from "../state/todos"


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