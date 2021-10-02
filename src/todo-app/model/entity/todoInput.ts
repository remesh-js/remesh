import { Remesh } from '../../../remesh'

export const TodoInputState = Remesh.state<string>({
    name: 'TodoInputState',
    default: ''
})

export const updateTodoInput = Remesh.command({
    name: 'updateTodoInput',
    impl: (_, newTodoInput: string) => {
        return TodoInputState(newTodoInput)
    }
})
