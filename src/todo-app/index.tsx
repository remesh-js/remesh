import React, { useState } from "react"

import { Remesh } from "../remesh"
import {
  useRemeshAggregate,
  useRemeshEmit,
  useRemeshEvent,
  useRemeshQuery,
} from "../remesh/react"

import { TodoInputState } from "./model/entity/todoInput"
import {
  TodoMatchedListQuery,
  UserRemoveTodoEvent,
  UserToggleTodoEvent,
  UserUpdateTodoEvent,
  TodoListAggregate,
} from "./model/aggregate/TodoList"

import {
  UserAddTodoEvent,
  UserInputTodoEvent,
  UserToggleAllTodosEvent,
  TodoHeaderAggregate,
} from "./model/aggregate/TodoHeader"

import {
  UserChangeTodoFilterEvent,
  TodoFooterAggregate,
} from "./model/aggregate/TodoFooter"

import {
  AddTodoFailedEvent,
  IsAllCompletedQuery,
  Todo,
  TodoSortedListQuery,
} from "./model/entity/todos"
import { TodoFilterState } from "./model/entity/todoFilter"

const TodoHeaderQuery = Remesh.query({
  name: "TodoHeaderQuery",
  impl: ({ get }) => {
    const isAllCompleted = get(IsAllCompletedQuery)
    const todoInput = get(TodoInputState)

    return {
      isAllCompleted,
      todoInput,
    }
  },
})

export const TodoHeader = () => {
  const emit = useRemeshEmit()

  const { isAllCompleted, todoInput } = useRemeshQuery(TodoHeaderQuery)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    emit(UserInputTodoEvent(event.target.value))
  }

  const handleAdd = () => {
    emit(UserAddTodoEvent(todoInput))
  }

  const handleToggleAllTodos = () => {
    emit(UserToggleAllTodosEvent())
  }

  useRemeshEvent(AddTodoFailedEvent, (event) => {
    alert(event.message)
  })

  useRemeshAggregate(TodoHeaderAggregate)

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
  const matchedTodoList = useRemeshQuery(TodoMatchedListQuery)

  useRemeshAggregate(TodoListAggregate)

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
        UserUpdateTodoEvent({
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
    emit(UserRemoveTodoEvent(props.todo.id))
  }

  const handleToggle = () => {
    emit(UserToggleTodoEvent(props.todo.id))
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

const TodoFooterQuery = Remesh.query({
  name: "TodoFooterQuery",
  impl: ({ get }) => {
    const { activeTodoList } = get(TodoSortedListQuery)
    const todoFilter = get(TodoFilterState)

    return {
      todoFilter,
      itemLeft: activeTodoList.length,
    }
  },
})

const TodoFooter = () => {
  const emit = useRemeshEmit()
  const { itemLeft, todoFilter } = useRemeshQuery(TodoFooterQuery)

  useRemeshAggregate(TodoFooterAggregate)

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
          emit(UserChangeTodoFilterEvent("all"))
        }}
      >
        All
      </span>{" "}
      <span
        style={{
          color: todoFilter === "active" ? "red" : "",
        }}
        onClick={() => {
          emit(UserChangeTodoFilterEvent("active"))
        }}
      >
        Active
      </span>{" "}
      <span
        style={{
          color: todoFilter === "completed" ? "red" : "",
        }}
        onClick={() => {
          emit(UserChangeTodoFilterEvent("completed"))
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
