import React, { useState } from "react"

import {
  useRemeshEmit,
  useRemeshEvent,
  useRemeshQuery,
  useRemeshDomain,
} from "../remesh/react"

import {
  Todo,
  TodoAppHeaderDomain,
  TodoAppMainDomain,
  TodoAppFooterDomain,
} from "../todo-app/domains/todoApp"

export const TodoHeader = () => {
  const emit = useRemeshEmit()

  const todoAppHeaderDomain = useRemeshDomain(TodoAppHeaderDomain)

  const todoInput = useRemeshQuery(todoAppHeaderDomain.query.TodoInputQuery())

  const isAllCompleted = useRemeshQuery(
    todoAppHeaderDomain.query.IsAllCompletedQuery()
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    emit(todoAppHeaderDomain.event.TodoInputEvent(event.target.value))
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
  const todoListDomain = useRemeshDomain(TodoAppMainDomain)
  const matchedTodoList = useRemeshQuery(
    todoListDomain.query.TodoMatchedListQuery()
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
  const todoListDomain = useRemeshDomain(TodoAppMainDomain)
  const emit = useRemeshEmit()

  const [text, setText] = useState("")
  const [edit, setEdit] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const handleBlur = () => {
    if (text === props.todo.content) {
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

  const todoAppFooterDomain = useRemeshDomain(TodoAppFooterDomain)

  const itemLeft = useRemeshQuery(
    todoAppFooterDomain.query.TodoItemLeftCountQuery()
  )
  const todoFilter = useRemeshQuery(todoAppFooterDomain.query.TodoFilterQuery())

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
          emit(todoAppFooterDomain.event.ChangeTodoFilterEvent("all"))
        }}
      >
        All
      </span>{" "}
      <span
        style={{
          color: todoFilter === "active" ? "red" : "",
        }}
        onClick={() => {
          emit(todoAppFooterDomain.event.ChangeTodoFilterEvent("active"))
        }}
      >
        Active
      </span>{" "}
      <span
        style={{
          color: todoFilter === "completed" ? "red" : "",
        }}
        onClick={() => {
          emit(todoAppFooterDomain.event.ChangeTodoFilterEvent("completed"))
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
