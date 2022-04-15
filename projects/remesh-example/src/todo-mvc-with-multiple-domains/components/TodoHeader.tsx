import React from 'react'

import { useRemeshDomain, useRemeshEvent, useRemeshQuery } from 'remesh-react'

import { TodoInputDomain } from '../domains/TodoInput'
import { TodoListDomain } from '../domains/TodoList'

import { useKeyPressHandler } from '../hooks/useKeyPressHandler'

export const TodoHeader = () => {
  const todoInputDomain = useRemeshDomain(TodoInputDomain())
  const todoListDomain = useRemeshDomain(TodoListDomain())

  const todoInput = useRemeshQuery(todoInputDomain.query.todoInput())

  const handleTodoInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    todoInputDomain.command.setTodoInput(event.target.value)
  }

  const handlePressEnter = useKeyPressHandler('Enter', () => {
    todoListDomain.command.addTodo(todoInput)
  })

  useRemeshEvent(todoListDomain.event.FailedToAddTodoEvent, (event) => {
    alert(event.reason)
  })

  return (
    <header className="header">
      <h1>todos</h1>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        value={todoInput}
        onChange={handleTodoInputChange}
        onKeyDown={handlePressEnter}
      />
    </header>
  )
}
