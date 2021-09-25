export * from './remesh';
import { Remesh } from './remesh'
import { map } from 'rxjs/operators'
import { merge } from 'rxjs';

type Todo = {
    id: number
    content: string
    completed: boolean
}

const TodoListState = Remesh.state<Todo[]>({
    name: 'TodoListState',
    default: []
})

type TodoFilter = 'all' | 'completed' | 'active'

const TodoFilterState = Remesh.state<TodoFilter>({
    name: 'TodoFilterState',
    default: 'all'
})

const TodoInputState = Remesh.state<string>({
    name: 'TodoInputState',
    default: ''
})

const TodoSortedListQuery = Remesh.query({
    name: 'TodoSortedListQuery',
    impl: ({ get }) => {
        const todoList = get(TodoListState)
        const activeTodoList: Todo[] = []
        const completedTodoList: Todo[] = []

        for (const todo of todoList) {
            if (todo.completed) {
                completedTodoList.push(todo)
            } else {
                activeTodoList.push(todo)
            }
        }

        return {
            activeTodoList,
            completedTodoList
        }
    }
})

const TodoFilteredListQuery = Remesh.query({
    name: 'TodoFilteredListQuery',
    impl: ({ get }) => {
        const todoList = get(TodoListState)
        const todoSortedList = get(TodoSortedListQuery)
        const todoFilter = get(TodoFilterState)

        if (todoFilter === 'active') {
            return todoSortedList.activeTodoList
        }

        if (todoFilter === 'completed') {
            return todoSortedList.completedTodoList
        }

        return todoList
    }
})

const TodoMatchedListQuery = Remesh.query({
    name: 'TodoMatchedListQuery',
    impl: ({ get }) => {
        const todoFilteredList = get(TodoFilteredListQuery)
        const todoInput = get(TodoInputState)

        if (todoInput.length === 0) {
            return todoFilteredList
        }

        const todoMatchedList = todoFilteredList.filter(todo => {
            return todo.content.includes(todoInput)
        })

        return todoMatchedList
    }
})

const updateTodoInput = Remesh.command({
    name: 'updateTodoInput',
    impl: (_, newTodoInput: string) => {
        return TodoInputState(newTodoInput)
    }
})

const changeTodoFilter = Remesh.command({
    name: 'changeTodoFilter',
    impl: (_, newTodoFilter: TodoFilter) => {
        return TodoFilterState(newTodoFilter)
    }
})

type AddTodoFailedEventData = {
    message: string
}

const AddTodoFailedEvent = Remesh.event<AddTodoFailedEventData>({
    name: 'AddTodoFailedEvent'
})

type AddTodoSucceededEventData = {
    newTodo: Todo
}

const AddTodoSuccessEvent = Remesh.event<AddTodoSucceededEventData>({
    name: 'AddTodoSuccessEvent'
})

let todoUid = 0

const addTodo = Remesh.command({
    name: 'addTodo',
    impl: ({ get }, todoContent: string) => {
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



const removeTodo = Remesh.command({
    name: 'removeTodo',
    impl: ({ get }, todoId: number) => {
        const todoList = get(TodoListState)
        const newTodoList = todoList.filter(todo => todo.id !== todoId)

        return TodoListState(newTodoList)
    }
})

type UpdateTodoPayload = {
    todoId: number
    content: string
}

const updateTodo = Remesh.command({
    name: 'updateTodo',
    impl: ({ get }, payload: UpdateTodoPayload) => {
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

const toggleTodo = Remesh.command({
    name: 'toggleTodo',
    impl: ({ get }, todoId: number) => {
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

const UserAddTodoEvent = Remesh.event<string>({
    name: 'UserAddTodoEvent'
})

const UserInputTodoEvent = Remesh.event<string>({
    name: 'UserInputTodoEvent'
})

const TodoHeaderAggregate = Remesh.aggregate({
    name: 'TodoHeaderAggregate',
    impl: ({ fromEvent }) => {
        const addTodo$ = fromEvent(UserAddTodoEvent).pipe(
            map(todoContent => addTodo(todoContent))
        )

        const changeTodoInput$ = fromEvent(UserInputTodoEvent).pipe(
            map(todoInput => updateTodoInput(todoInput))
        )

        const clearTodoInput$ = fromEvent(AddTodoSuccessEvent).pipe(
            map(() => updateTodoInput(''))
        )

        return merge(addTodo$, changeTodoInput$, clearTodoInput$)
    }
})

const UserToggleTodoEvent = Remesh.event<number>({
    name: 'UserToggleTodoEvent'
})

const UserUpdateTodoEvent = Remesh.event<UpdateTodoPayload>({
    name: 'UserUpdateTodoEvent'
})

const UserRemoveTodoEvent = Remesh.event<number>({
    name: 'UserRemoveTodoEvent'
})

const TodoListAggregate = Remesh.aggregate({
    name: 'TodoListAggregate',
    impl: ({ fromEvent }) => {
        const toggleTodo$ = fromEvent(UserToggleTodoEvent).pipe(
            map(todoId => toggleTodo(todoId))
        )

        const updateTodo$ = fromEvent(UserUpdateTodoEvent).pipe(
            map(updateTodoPayload => updateTodo(updateTodoPayload))
        )

        const removeTodo$ = fromEvent(UserRemoveTodoEvent).pipe(
            map(todoId => removeTodo(todoId))
        )

        return merge(toggleTodo$, updateTodo$, removeTodo$)
    }
})

const UserChangeTodoFilterEvent = Remesh.event<TodoFilter>({
    name: 'UserChangeTodoFilterEvent'
})

const TodoFooterAggregate = Remesh.aggregate({
    name: 'TodoFooterAggregate',
    impl: ({ fromEvent }) => {
        const changeTodoFilter$ = fromEvent(UserChangeTodoFilterEvent).pipe(
            map(newTodoFilter => changeTodoFilter(newTodoFilter))
        )

        return merge(changeTodoFilter$)
    }
})

const TodoAppAggregate = Remesh.aggregate({
    name: 'TodoAppAggregate',
    impl: ({ fromAggregate }) => {
        return merge(
            fromAggregate(TodoHeaderAggregate()),
            fromAggregate(TodoListAggregate()),
            fromAggregate(TodoFooterAggregate())
        )
    }
})


const store = Remesh.store({
    name: 'TodoStore'
})


const TodoAppQuery = Remesh.query({
    name: 'TodoAppQuery',
    impl: ({ get }) => {
        const todoList = get(TodoListState)
        const todoSortedList = get(TodoSortedListQuery)
        const todoFilteredList = get(TodoFilteredListQuery)
        const todoMatchedList = get(TodoMatchedListQuery)
        const todoFilter = get(TodoFilterState)
        const todoInput = get(TodoInputState)

        return {
            todoInput,
            todoFilter,
            todoList,
            todoSortedList,
            todoFilteredList,
            todoMatchedList
        }
    }
})

store.useAggregate(TodoAppAggregate())

store.fromQuery(TodoAppQuery).subscribe(todoAppState => {
    console.log('todo-app-state', JSON.stringify(todoAppState, null, 2))
})

store.emit(UserInputTodoEvent('123'))

store.emit(UserAddTodoEvent('123'))