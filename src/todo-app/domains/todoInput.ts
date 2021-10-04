import { map } from 'rxjs/operators'
import { Remesh } from '../../remesh'

export const TodoInputDomain = Remesh.domain({
    name: 'TodoInputDomain',
    impl: domain => {
        const TodoInputState = domain.state({
            name: 'TodoInputState',
            default: ''
        })

        const TodoInputQuery = domain.query({
            name: 'TodoInputQuery',
            impl: ({ get }) => {
                const todoInput = get(TodoInputState)
                return todoInput
            }
        })

        const updateTodoInput = domain.command({
            name: 'updateTodoInput',
            impl: (_, newTodoInput: string) => {
                return TodoInputState(newTodoInput)
            }
        })

        const TodoInputEvent = domain.event<string>({
            name: 'TodoInputEvent'
        })

        const TodoInputEffect = domain.effect({
            name: 'TodoInputEffect',
            impl: ({ fromEvent }) => {
                return fromEvent(TodoInputEvent).pipe(
                    map(newTodoInput => updateTodoInput(newTodoInput))
                )
            }
        })

        return {
            autorun: [TodoInputEffect],
            query: {
                TodoInputQuery
            },
            command: {
                updateTodoInput
            },
            event: {
                TodoInputEvent,
            }
        }
    }
})
