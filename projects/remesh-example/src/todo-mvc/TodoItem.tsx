import { Todo, TodoDomain } from './todo'
import { useRemeshDomain } from 'remesh-react'
import React, { useEffect, useRef, useState } from 'react'
import {useInput, useOnEnter} from "./hooks";

export function TodoItem({ todo }: { todo: Todo }) {
  const domain = useRemeshDomain(TodoDomain())

  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing) {
      ref.current?.focus()
    }
  }, [editing])

  const [todoName, onTodoNameChange] = useInput(todo.name)
  const onEnter = useOnEnter(() => {
    domain.command.updateTodo({ ...todo, name: todoName })
    setEditing(false)
  })

  let handleViewClick = () => {
    setEditing(true)
  }

  let onDelete = () => {
    domain.command.removeTodo(todo.id)
  }

  let onDone = () => {
    domain.command.toggleTodoCompleted({
      id: todo.id,
      completed: !todo.completed,
    })
  }

  return (
    <li onDoubleClick={handleViewClick} className={`${editing ? 'editing' : ''} ${todo.completed ? 'completed' : ''}`}>
      <div className="view">
        <input type="checkbox" className="toggle" checked={todo.completed} onChange={onDone} />
        <label>{todo.name}</label>
        <button className="destroy" onClick={onDelete} />
      </div>
      {editing && (
        <input
          ref={ref}
          className="edit"
          value={todoName}
          onChange={onTodoNameChange}
          onKeyPress={onEnter}
          onBlur={() => {
            setEditing(false)
          }}
        />
      )}
    </li>
  )
}
