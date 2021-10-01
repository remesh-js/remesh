import { Remesh } from '../../../remesh'

export const TodoInputState = Remesh.state<string>({
    name: 'TodoInputState',
    default: ''
})

export type TodoInputChangedEventData = {
    previous: string
    current: string
}

export const TodoInputChangedEvent = Remesh.event<TodoInputChangedEventData>({
    name: 'TodoInputChangedEvent'
})

export const updateTodoInput = Remesh.command({
    name: 'updateTodoInput',
    impl: (newTodoInput: string, { get }) => {
        const currentTodoInput = get(TodoInputState)

        const todoInputChangedEventData: TodoInputChangedEventData = {
            previous: currentTodoInput,
            current: newTodoInput
        }

        return [
            TodoInputState(newTodoInput),
            TodoInputChangedEvent(todoInputChangedEventData)
        ]
    }
})
