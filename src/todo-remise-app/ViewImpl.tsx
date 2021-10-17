import React from "react"

import { TodoHeader, TodoList, TodoItem, TodoFooter } from "./View"

export const TodoHeaderImpl = TodoHeader.impl((props) => {
  return (
    <div>
      <input
        type="checkbox"
        checked={props.isAllCompleted}
        readOnly
        onClick={props.handleToggleAllTodos}
      />
      <input
        type="text"
        placeholder="Input your todo here"
        value={props.todoInput}
        onChange={(event) => props.handleChange(event.target.value)}
      />
      <button onClick={() => props.handleAdd()}>add</button>
    </div>
  )
})

export const TodoListImpl = TodoList.impl((props) => {
  return (
    <div>
      {props.matchedTodoIdList.map((todoId) => {
        return <TodoItem key={todoId} todoId={todoId} />
      })}
    </div>
  )
})

export const TodoItemImpl = TodoItem.impl((props) => {
  return (
    <div>
      {!props.edit && (
        <label onDoubleClick={props.handleEnableEdit}>
          {props.todo.content}
        </label>
      )}
      {props.edit && (
        <input
          type="text"
          value={props.text}
          onChange={(event) => props.handleEditing(event.target.value)}
          onBlur={props.handleSubmit}
        />
      )}
      <button onClick={props.handleToggle}>
        {props.todo.completed ? "completed" : "active"}
      </button>
      <button onClick={props.handleRemove}>remove</button>
    </div>
  )
})

export const TodoFooterImpl = TodoFooter.impl((props) => {
  return (
    <div>
      <span>
        {props.itemLeft} item
        {props.itemLeft === 0 || props.itemLeft > 1 ? `s` : ""} left
      </span>
      {" | "}
      <span
        style={{
          color: props.todoFilter === "all" ? "red" : "",
        }}
        onClick={() => {
          props.handleSwitchTodoFilter("all")
        }}
      >
        All
      </span>{" "}
      <span
        style={{
          color: props.todoFilter === "active" ? "red" : "",
        }}
        onClick={() => {
          props.handleSwitchTodoFilter("active")
        }}
      >
        Active
      </span>{" "}
      <span
        style={{
          color: props.todoFilter === "completed" ? "red" : "",
        }}
        onClick={() => {
          props.handleSwitchTodoFilter("completed")
        }}
      >
        Completed
      </span>
    </div>
  )
})
