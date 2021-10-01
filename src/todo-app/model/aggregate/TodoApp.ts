import { merge } from "rxjs"
import { Remesh } from "../../../remesh"
import { TodoFooterAggregate } from "./TodoFooter"
import { TodoHeaderAggregate } from "./TodoHeader"
import { TodoListAggregate } from "./TodoList"

export const TodoAppAggregate = Remesh.aggregate({
    name: 'TodoAppAggregate',
    impl: ({ fromAggregate }) => {
        return merge(
            fromAggregate(TodoHeaderAggregate()),
            fromAggregate(TodoListAggregate()),
            fromAggregate(TodoFooterAggregate())
        )
    }
})
