import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"

import { changeTodoFilter, TodoFilter } from "../entity/todoFilter"

export const UserChangeTodoFilterEvent = Remesh.event<TodoFilter>({
    name: 'UserChangeTodoFilterEvent'
})

export const TodoFooterAggregate = Remesh.aggregate({
    name: 'TodoFooterAggregate',
    impl: ({ fromEvent }) => {
        const changeTodoFilter$ = fromEvent(UserChangeTodoFilterEvent).pipe(
            map(newTodoFilter => changeTodoFilter(newTodoFilter))
        )

        return merge(changeTodoFilter$)
    }
})