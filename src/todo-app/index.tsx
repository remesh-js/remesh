import React, { useState } from "react"

import {
  useRemeshEmit,
  useRemeshEvent,
  useRemeshQuery,
  useRemeshDomain,
} from "../remesh/react"

import { TodoFilterDomain } from "../todo-app/domains/todoFilter"
import { TodoInputDomain } from "../todo-app/domains/todoInput"
import { Todo, TodoListDomain } from "../todo-app/domains/todoList"

export const TodoHeader = () => {
  const emit = useRemeshEmit()
  const todoInputDomain = useRemeshDomain(TodoInputDomain)
  const todoListDomain = useRemeshDomain(TodoListDomain)
  const todoInput = useRemeshQuery(todoInputDomain.query.TodoInputQuery)
  const isAllCompleted = useRemeshQuery(
    todoListDomain.query.IsAllCompletedQuery
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    emit(todoInputDomain.event.TodoInputEvent(event.target.value))
  }

  const handleAdd = () => {
    emit(todoListDomain.event.AddTodoEvent(todoInput))
  }

  const handleToggleAllTodos = () => {
    emit(todoListDomain.event.ToggleAllTodosEvent())
  }

  useRemeshEvent(todoListDomain.event.AddTodoFailedEvent, (event) => {
    alert(event.message)
  })

  return (
    <div>
      <input
        type="checkbox"
        checked={isAllCompleted}
        readOnly
        onClick={handleToggleAllTodos}
      />
      <input
        type="text"
        placeholder="Input your todo here"
        value={todoInput}
        onChange={handleChange}
      />
      <button onClick={handleAdd}>add</button>
    </div>
  )
}

const TodoList = () => {
  const todoListDomain = useRemeshDomain(TodoListDomain)
  const matchedTodoList = useRemeshQuery(
    todoListDomain.query.TodoMatchedListQuery
  )

  return (
    <div>
      {matchedTodoList.map((todo) => {
        return <TodoItem key={todo.id} todo={todo} />
      })}
    </div>
  )
}

type TodoItemProps = {
  todo: Todo
}

const TodoItem = (props: TodoItemProps) => {
  const todoListDomain = useRemeshDomain(TodoListDomain)
  const emit = useRemeshEmit()

  const [text, setText] = useState("")
  const [edit, setEdit] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const handleBlur = () => {
    if (text.length === 0 || text === props.todo.content) {
      setEdit(false)
    } else {
      emit(
        todoListDomain.event.UpdateTodoEvent({
          todoId: props.todo.id,
          content: text,
        })
      )
      setText("")
      setEdit(false)
    }
  }

  const handleDoubleClick = () => {
    setEdit(true)
    setText(props.todo.content)
  }

  const handleRemove = () => {
    emit(todoListDomain.event.RemoveTodoEvent(props.todo.id))
  }

  const handleToggle = () => {
    emit(todoListDomain.event.ToggleTodoEvent(props.todo.id))
  }

  return (
    <div>
      {!edit && (
        <label onDoubleClick={handleDoubleClick}>{props.todo.content}</label>
      )}
      {edit && (
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      )}
      <button onClick={handleToggle}>
        {props.todo.completed ? "completed" : "active"}
      </button>
      <button onClick={handleRemove}>remove</button>
    </div>
  )
}

const TodoFooter = () => {
  const emit = useRemeshEmit()
  const todoFilterDomain = useRemeshDomain(TodoFilterDomain)
  const todoListDomain = useRemeshDomain(TodoListDomain)
  const { activeTodoList } = useRemeshQuery(
    todoListDomain.query.TodoSortedListQuery
  )
  const todoFilter = useRemeshQuery(todoFilterDomain.query.TodoFilterQuery)

  const itemLeft = activeTodoList.length

  return (
    <div>
      <span>
        {itemLeft} item{itemLeft === 0 || itemLeft > 1 ? `s` : ""} left
      </span>
      {" | "}
      <span
        style={{
          color: todoFilter === "all" ? "red" : "",
        }}
        onClick={() => {
          emit(todoFilterDomain.event.ChangeTodoFilterEvent("all"))
        }}
      >
        All
      </span>{" "}
      <span
        style={{
          color: todoFilter === "active" ? "red" : "",
        }}
        onClick={() => {
          emit(todoFilterDomain.event.ChangeTodoFilterEvent("active"))
        }}
      >
        Active
      </span>{" "}
      <span
        style={{
          color: todoFilter === "completed" ? "red" : "",
        }}
        onClick={() => {
          emit(todoFilterDomain.event.ChangeTodoFilterEvent("completed"))
        }}
      >
        Completed
      </span>
    </div>
  )
}

export const TodoApp = () => {
  return (
    <>
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </>
  )
}
