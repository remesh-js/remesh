import React, { useState } from "react"

import {
  useRemeshEmit,
  useRemeshEvent,
  useRemeshQuery,
  useRemeshDomain,
} from "../remesh/react"

import { remise } from "../remise"

import {
  TodoAppHeaderDomain,
  TodoAppMainDomain,
  TodoAppFooterDomain,
} from "../todo-app/domains/todoApp"
import { TodoFilter } from "./domains/todoFilter"

export const TodoHeader = remise(function TodoHeader() {
  const emit = useRemeshEmit()

  const todoAppHeaderDomain = useRemeshDomain(TodoAppHeaderDomain)

  const todoInput = useRemeshQuery(todoAppHeaderDomain.query.TodoInputQuery())

  const isAllCompleted = useRemeshQuery(
    todoAppHeaderDomain.query.IsAllCompletedQuery()
  )

  const handleChange = (value: string) => {
    emit(todoAppHeaderDomain.event.TodoInputEvent(value))
  }

  const handleAdd = () => {
    emit(todoAppHeaderDomain.event.AddTodoEvent(todoInput))
  }

  const handleToggleAllTodos = () => {
    emit(todoAppHeaderDomain.event.ToggleAllTodosEvent())
  }

  useRemeshEvent(todoAppHeaderDomain.event.AddTodoFailedEvent, (event) => {
    alert(event.message)
  })

  return {
    todoInput,
    isAllCompleted,
    handleAdd,
    handleChange,
    handleToggleAllTodos,
  }
})

export const TodoList = remise(function TodoList() {
  const todoListDomain = useRemeshDomain(TodoAppMainDomain)
  const matchedTodoIdList = useRemeshQuery(
    todoListDomain.query.TodoIdListQuery()
  )

  return {
    matchedTodoIdList,
  }
})

type TodoItemProps = {
  todoId: number
}

export const TodoItem = remise(function TodoItem(props: TodoItemProps) {
  const todoListDomain = useRemeshDomain(TodoAppMainDomain)
  const emit = useRemeshEmit()

  const todo = useRemeshQuery(todoListDomain.query.TodoItemQuery(props.todoId))

  const [text, setText] = useState("")
  const [edit, setEdit] = useState(false)

  const handleEditing = (value: string) => {
    setText(value)
  }

  const handleSubmit = () => {
    if (text === todo.content) {
      setEdit(false)
    } else {
      emit(
        todoListDomain.event.UpdateTodoEvent({
          todoId: todo.id,
          content: text,
        })
      )
      setText("")
      setEdit(false)
    }
  }

  const handleEnableEdit = () => {
    setEdit(true)
    setText(todo.content)
  }

  const handleRemove = () => {
    emit(todoListDomain.event.RemoveTodoEvent(props.todoId))
  }

  const handleToggle = () => {
    emit(todoListDomain.event.ToggleTodoEvent(props.todoId))
  }

  return {
    todo,
    edit,
    text,
    handleToggle,
    handleRemove,
    handleEnableEdit,
    handleSubmit,
    handleEditing,
  }
})

export const TodoFooter = remise(function TodoFooter() {
  const emit = useRemeshEmit()

  const todoAppFooterDomain = useRemeshDomain(TodoAppFooterDomain)

  const itemLeft = useRemeshQuery(
    todoAppFooterDomain.query.TodoItemLeftCountQuery()
  )
  const todoFilter = useRemeshQuery(todoAppFooterDomain.query.TodoFilterQuery())

  const handleSwitchTodoFilter = (todoFilter: TodoFilter) => {
    emit(todoAppFooterDomain.event.ChangeTodoFilterEvent(todoFilter))
  }

  return {
    itemLeft,
    todoFilter,
    handleSwitchTodoFilter,
  }
})

export const TodoApp = () => {
  return (
    <>
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </>
  )
}
