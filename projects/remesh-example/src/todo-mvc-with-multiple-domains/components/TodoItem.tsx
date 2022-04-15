import React, { useEffect, useRef, useState } from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { Todo, TodoListDomain } from '../domains/TodoList'

import { useKeyPressHandler } from '../hooks/useKeyPressHandler'
import { useInputHandler } from '../hooks/useInputHandler'

export type TodoItemProps = {
  id: Todo['id']
}

export function TodoItem(props: TodoItemProps) {
  const todoListDomain = useRemeshDomain(TodoListDomain())

  const todo = useRemeshQuery(todoListDomain.query.todoState(props.id))

  const [editing, setEditing] = useState(false)

  const [title, handleTitleChange] = useInputHandler(todo.title)

  const save = () => {
    todoListDomain.command.updateTodo({ ...todo, title })
    setEditing(false)
  }

  const handlePress = useKeyPressHandler(['Enter', 'Escape'], () => {
    save()
  })

  const handleEnableEdit = () => {
    setEditing(true)
  }

  const handleSave = () => {
    todoListDomain.command.toggleTodo(todo.id)
  }

  const handleDelete = () => {
    todoListDomain.command.deleteTodo(todo.id)
  }

  const handleBlur = () => {
    save()
  }

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  return (
    <li className={`${editing && 'editing'} ${todo.completed && 'completed'}`}>
      <div className="view">
        <input type="checkbox" className="toggle" checked={todo.completed} onChange={handleSave} />
        <label onDoubleClick={handleEnableEdit}>{todo.title}</label>
        <button className="destroy" onClick={handleDelete} />
      </div>
      {editing && (
        <input
          ref={inputRef}
          className="edit"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handlePress}
          onBlur={handleBlur}
        />
      )}
    </li>
  )
}
