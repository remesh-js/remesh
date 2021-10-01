import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"
import { UserAddTodoEvent, UserInputTodoEvent } from "../event"
import { updateTodoInput } from "../state/todoInput"
import { addTodo, AddTodoSuccessEvent } from "../state/todos"

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

        return merge(addTodo$, changeTodoInput$, clearTodoInput$)
    }
})