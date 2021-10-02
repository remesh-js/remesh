import { Remesh } from '../../../remesh'

import { TodoFilterState } from '../state/todoFilter'
import { TodoInputState } from '../state/todoInput'
import { Todo, TodoListState } from '../state/todos'

export const TodoSortedListQuery = Remesh.query({
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

export const TodoFilteredListQuery = Remesh.query({
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

export const TodoMatchedListQuery = Remesh.query({
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


export const IsAllCompletedQuery = Remesh.query({
    name: 'IsAllCompletedQuery',
    impl: ({ get }) => {
        const { activeTodoList, completedTodoList } = get(TodoSortedListQuery)

        return activeTodoList.length === 0 && completedTodoList.length > 0
    }
})

