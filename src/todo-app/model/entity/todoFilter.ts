import { Remesh } from '../../../remesh'

export type TodoFilter = 'all' | 'completed' | 'active'

export const TodoFilterState = Remesh.state<TodoFilter>({
    name: 'TodoFilterState',
    default: 'all'
})

export const changeTodoFilter = Remesh.command({
    name: 'changeTodoFilter',
    impl: ({}, newTodoFilter: TodoFilter) => {
        return TodoFilterState(newTodoFilter)
    }
})