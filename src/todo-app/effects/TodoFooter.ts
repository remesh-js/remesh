import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../remesh"

import { changeTodoFilter, TodoFilter } from "../models/todoFilter"

export const UserChangeTodoFilterEvent = Remesh.event<TodoFilter>({
    name: 'UserChangeTodoFilterEvent'
})

export const TodoFooterEffect = Remesh.effect({
    name: 'TodoFooterEffect',
    impl: ({ fromEvent }) => {
        const changeTodoFilter$ = fromEvent(UserChangeTodoFilterEvent).pipe(
            map(newTodoFilter => changeTodoFilter(newTodoFilter))
        )

        return merge(changeTodoFilter$)
    }
})