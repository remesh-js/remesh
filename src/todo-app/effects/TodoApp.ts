import { merge } from "rxjs"
import { Remesh } from "../../remesh"
import { TodoFooterEffect } from "./TodoFooter"
import { TodoHeaderEffect } from "./TodoHeader"
import { TodoListEffect } from "./TodoList"

export const TodoAppEffect = Remesh.effect({
    name: 'TodoAppEffect',
    impl: ({ fromEffect }) => {
        return merge(
            fromEffect(TodoHeaderEffect()),
            fromEffect(TodoListEffect()),
            fromEffect(TodoFooterEffect())
        )
    }
})
