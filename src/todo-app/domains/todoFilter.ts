import { Remesh } from '../../remesh'

export type TodoFilter = 'all' | 'completed' | 'active'

export const TodoFilterDomain = Remesh.domain({
    name: 'TodoFilterDomain',
    impl: domain => {
        const TodoFilterState = domain.state<TodoFilter>({
            name: 'TodoFilterState',
            default: 'all'
        })

        const updateTodoFilter = domain.command({
            name: 'updateTodoFilter',
            impl: ({ }, newTodoFilter: TodoFilter) => {
                return TodoFilterState().new(newTodoFilter);
            }
        })

        return {
            command: {
                updateTodoFilter
            },
            query: {
                TodoFilterQuery: TodoFilterState.Query
            }
        }
    }
})