import React, { useEffect, useRef, useState } from 'react'
import { useRemeshDomain } from 'remesh-react'

import { Todo, TodoDomain } from './todo'
import { useInputHandler, useKeyPressHandler } from './hooks'

export function TodoItem({ todo }: { todo: Todo }) {
  const domain = useRemeshDomain(TodoDomain())

  const [editing, setEditing] = useState(false)

  const ref = useRef<HTMLInputElement>(null)

  const [todoName, handleTodoNameChange] = useInputHandler(todo.name)

  const handlePressEnter = useKeyPressHandler('Enter', () => {
    domain.command.updateTodo({ ...todo, name: todoName })
    setEditing(false)
  })

  const handleEnableEdit = () => {
    setEditing(true)
  }

  const handleSave = () => {
    domain.command.toggleTodoCompleted(todo.id)
  }

  const handleDelete = () => {
    domain.command.removeTodo(todo.id)
  }

  useEffect(() => {
    if (editing) {
      ref.current?.focus()
    }
  }, [editing])

  return (
    <li onDoubleClick={handleEnableEdit} className={`${editing ? 'editing' : ''} ${todo.completed ? 'completed' : ''}`}>
      <div className="view">
        <input type="checkbox" className="toggle" checked={todo.completed} onChange={handleSave} />
        <label>{todo.name}</label>
        <button className="destroy" onClick={handleDelete} />
      </div>
      {editing && (
        <input
          ref={ref}
          className="edit"
          value={todoName}
          onChange={handleTodoNameChange}
          onKeyPress={handlePressEnter}
          onBlur={() => {
            setEditing(false)
          }}
        />
      )}
    </li>
  )
}
