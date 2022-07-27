import React from 'react'

import { useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { TodoInputDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoInput'
import { TodoListDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoList'

import { useKeyPressHandler } from '../hooks/useKeyPressHandler'

export const TodoHeader = () => {
  const send = useRemeshSend()
  const todoInputDomain = useRemeshDomain(TodoInputDomain())
  const todoListDomain = useRemeshDomain(TodoListDomain())

  const todoInput = useRemeshQuery(todoInputDomain.query.TodoInputQuery())

  const handleTodoInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    send(todoInputDomain.command.SetTodoInputCommand(event.target.value))
  }

  const handlePressEnter = useKeyPressHandler('Enter', () => {
    send(todoListDomain.command.AddTodoCommand(todoInput))
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
