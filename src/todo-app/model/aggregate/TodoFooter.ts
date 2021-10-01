import { merge } from "rxjs"
import { map } from "rxjs/operators"
import { Remesh } from "../../../remesh"
import { UserChangeTodoFilterEvent } from "../event"
import { changeTodoFilter } from "../state/todoFilter"

export const TodoFooterAggregate = Remesh.aggregate({
    name: 'TodoFooterAggregate',
    impl: ({ fromEvent }) => {
        const changeTodoFilter$ = fromEvent(UserChangeTodoFilterEvent).pipe(
            map(newTodoFilter => changeTodoFilter(newTodoFilter))
        )

        return merge(changeTodoFilter$)
    }
})