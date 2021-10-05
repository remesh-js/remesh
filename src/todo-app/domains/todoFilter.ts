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
                return get(TodoFilterState)
            }
        })

        const updateTodoFilter = domain.command({
            name: 'changeTodoFilter',
            impl: ({ }, newTodoFilter: TodoFilter) => {
                return TodoFilterState(newTodoFilter)
            }
        })

        const ChangeTodoFilterEvent = domain.event<TodoFilter>({
            name: 'ChangeTodoFilterEvent'
        })

        const TodoFooterTask = domain.task({
            name: 'TodoFooterTask',
            impl: ({ fromEvent }) => {
                const changeTodoFilter$ = fromEvent(ChangeTodoFilterEvent).pipe(
                    map(newTodoFilter => updateTodoFilter(newTodoFilter))
                )
                return changeTodoFilter$
            }
        })

        return {
            autorun: [TodoFooterTask],
            event: {
                ChangeTodoFilterEvent
            },
            query: {
                TodoFilterQuery
            },
            command: {
                updateTodoFilter
            }
        }

    }
})