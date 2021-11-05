import { map } from 'rxjs/operators'
import { Remesh } from '../../remesh'

export type TodoFilter = 'all' | 'completed' | 'active'

export const TodoFilterDomain = Remesh.domain({
    name: 'TodoFilterDomain',
    impl: domain => {
        const TodoFilterState = domain.state<TodoFilter>({
            name: 'TodoFilterState',
            default: 'all'
        })

        const TodoFilterQuery = domain.query({
            name: 'TodoFilterQuery',
            impl: ({ get }) => {
                return get(TodoFilterState())
            }
        })

        const updateTodoFilter = domain.command({
            name: 'changeTodoFilter',
            impl: ({  }, newTodoFilter: TodoFilter) => {
                return (TodoFilterState().new(newTodoFilter))
            }
        })

        const TodoFooterTask = domain.task({
            name: 'TodoFooterTask',
            impl: ({ fromEvent }) => {
                const changeTodoFilter$ = fromEvent(updateTodoFilter.Event).pipe(
                    map(newTodoFilter => updateTodoFilter(newTodoFilter))
                )
                return changeTodoFilter$
            }
        })

        return {
            autorun: [TodoFooterTask],
            event: {
                ChangeTodoFilterEvent: updateTodoFilter.Event
            },
            query: {
                TodoFilterQuery
            }
        }
    }
})