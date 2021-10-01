import { Remesh } from '../../../remesh'

export type Todo = {
    id: number
    content: string
    completed: boolean
}

export const TodoListState = Remesh.state<Todo[]>({
    name: 'TodoListState',
    default: []
})

export type AddTodoFailedEventData = {
    message: string
}

export const AddTodoFailedEvent = Remesh.event<AddTodoFailedEventData>({
    name: 'AddTodoFailedEvent'
})

export type AddTodoSucceededEventData = {
    newTodo: Todo
}

export const AddTodoSuccessEvent = Remesh.event<AddTodoSucceededEventData>({
    name: 'AddTodoSuccessEvent'
})

let todoUid = 0

export const addTodo = Remesh.command({
    name: 'addTodo',
    impl: (todoContent: string, { get }) => {
        const todoList = get(TodoListState)

        if (todoContent.length === 0) {
            return AddTodoFailedEvent({
                message: `Unexpected empty todo input`
            })
        }

        const newTodo: Todo = {
            id: todoUid++,
            content: todoContent,
            completed: false
        }

        const newTodoList = todoList.concat(newTodo)

        return [
            TodoListState(newTodoList),
            AddTodoSuccessEvent({ newTodo })
        ]
    }
})

export const removeTodo = Remesh.command({
    name: 'removeTodo',
    impl: (todoId: number, { get }) => {
        const todoList = get(TodoListState)
        const newTodoList = todoList.filter(todo => todo.id !== todoId)

        return TodoListState(newTodoList)
    }
})

export type UpdateTodoPayload = {
    todoId: number
    content: string
}

export const updateTodo = Remesh.command({
    name: 'updateTodo',
    impl: (payload: UpdateTodoPayload, { get }) => {
        const todoList = get(TodoListState)
        const newTodoList = todoList.filter(todo => {
            if (todo.id !== payload.todoId) {
                return todo
            }
            return {
                ...todo,
                content: payload.content
            }
        })

        return TodoListState(newTodoList)
    }
})

export const toggleTodo = Remesh.command({
    name: 'toggleTodo',
    impl: (todoId: number, { get }) => {
        const todoList = get(TodoListState)
        const newTodoList = todoList.filter(todo => {
            if (todo.id !== todoId) {
                return todo
            }
            return {
                ...todo,
                completed: !todo.completed
            }
        })

        return TodoListState(newTodoList)
    }
})
