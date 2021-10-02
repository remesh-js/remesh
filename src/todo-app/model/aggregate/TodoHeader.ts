import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"

import { updateTodoInput } from "../entity/todoInput"
import { addTodo, AddTodoSuccessEvent, toggleAllTodos } from "../entity/todos"

export const UserAddTodoEvent = Remesh.event<string>({
    name: 'UserAddTodoEvent'
})

export const UserInputTodoEvent = Remesh.event<string>({
    name: 'UserInputTodoEvent'
})

export const UserToggleAllTodosEvent = Remesh.event({
    name: 'UserToggleAllTodosEvent'
})

export const TodoHeaderAggregate = Remesh.aggregate({
    name: 'TodoHeaderAggregate',
    impl: ({ fromEvent }) => {
        const addTodo$ = fromEvent(UserAddTodoEvent).pipe(
            map(todoContent => addTodo(todoContent))
        )

        const changeTodoInput$ = fromEvent(UserInputTodoEvent).pipe(
            map(todoInput => updateTodoInput(todoInput))
        )

        const clearTodoInput$ = fromEvent(AddTodoSuccessEvent).pipe(
            map(() => updateTodoInput(''))
        )

        const toggleAllTodos$ = fromEvent(UserToggleAllTodosEvent).pipe(
            map(() => toggleAllTodos())
        )

        return merge(addTodo$, changeTodoInput$, clearTodoInput$, toggleAllTodos$)
    }
})