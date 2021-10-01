import { Remesh } from '../../../remesh'
import { TodoFilter } from '../state/todoFilter'
import { UpdateTodoPayload } from '../state/todos'

export const UserAddTodoEvent = Remesh.event<string>({
    name: 'UserAddTodoEvent'
})

export const UserInputTodoEvent = Remesh.event<string>({
    name: 'UserInputTodoEvent'
})

export const UserToggleTodoEvent = Remesh.event<number>({
    name: 'UserToggleTodoEvent'
})

export const UserUpdateTodoEvent = Remesh.event<UpdateTodoPayload>({
    name: 'UserUpdateTodoEvent'
})

export const UserRemoveTodoEvent = Remesh.event<number>({
    name: 'UserRemoveTodoEvent'
})

export const UserChangeTodoFilterEvent = Remesh.event<TodoFilter>({
    name: 'UserChangeTodoFilterEvent'
})
