import { Remesh } from '../../remesh'
import { TodoAppAggregate } from './aggregate/TodoApp'

export const store = Remesh.store({
    name: 'TodoStore'
})

store.useAggregate(TodoAppAggregate())