import { Remesh } from '../../../remesh'

export type TodoFilter = 'all' | 'completed' | 'active'

export const TodoFilterState = Remesh.state<TodoFilter>({
    name: 'TodoFilterState',
    default: 'all'
})

export type TodoFilterChangedEventData = {
    previous: string
    current: string
}

export const TodoFilterChangedEvent = Remesh.event<TodoFilterChangedEventData>({
    name: 'TodoFilterChangedEvent'
})

export const changeTodoFilter = Remesh.command({
    name: 'changeTodoFilter',
    impl: (newTodoFilter: TodoFilter, { get }) => {
        const currentTodoFilter = get(TodoFilterState)

        const todoFilterChangedEventData: TodoFilterChangedEventData = {
            previous: currentTodoFilter,
            current: newTodoFilter
        }

        return [
            TodoFilterState(newTodoFilter),
            TodoFilterChangedEvent(todoFilterChangedEventData)
        ]
    }
})