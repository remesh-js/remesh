import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"
import { UserAddTodoEvent, UserInputTodoEvent, UserToggleAllTodosEvent } from "../event"
import { updateTodoInput } from "../state/todoInput"
import { addTodo, AddTodoSuccessEvent, toggleAllTodos } from "../state/todos"

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