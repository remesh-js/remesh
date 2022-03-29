import { useRemeshDomain, useRemeshEvent, useRemeshQuery } from 'remesh-react'
import { TodoDomain } from './todo'
import { NavLink, useParams } from 'react-router-dom'
import { useInput, useOnEnter } from './hooks'
import React, { useEffect } from 'react'
import { TodoItem } from './TodoItem'

type FilterType = 'completed' | 'active' | undefined
export const TodoList = () => {
  const domain = useRemeshDomain(TodoDomain())

  const { filter } = useParams()

  const todoList = useRemeshQuery(domain.query.TodoListQuery(filter as FilterType))

  const activeTodoCount = useRemeshQuery(domain.query.ActiveTodoCountQuery())
  const hasCompleted = useRemeshQuery(domain.query.HasCompletedQuery())
  const allCompleted = useRemeshQuery(domain.query.AllCompletedQuery())

  useRemeshEvent(domain.event.addTodoFailEvent, () => {
    alert('Cannot be empty, please enter the TODO name')
  })

  const onToggleAll = () => {
    domain.command.toggleAllTodoCompleted(!allCompleted)
  }

  const [newTodo, onNewTodoChange, setNewTodo] = useInput('')
  const onEnter = useOnEnter(() => {
    domain.command.addTodo(newTodo)
    setNewTodo('')
  })

  const clearCompleted = () => {
    domain.command.clearCompleted()
  }

  useEffect(() => {
    domain.command.fetchTodoList()
  }, [])

  return (
    <div className="todoapp">
      <header className="header">
        <h1>todos</h1>
        <input
          className="new-todo"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={onNewTodoChange}
          onKeyDown={onEnter}
        />
      </header>

      <section className="main">
        <input id="toggle-all" type="checkbox" className="toggle-all" checked={allCompleted} onChange={onToggleAll} />
        <label htmlFor="toggle-all" />
        <ul className="todo-list">
          {todoList.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </section>

      <footer className="footer">
        <span className="todo-count">
          <strong>{activeTodoCount}</strong> items left
        </span>
        <ul className="filters">
          <li>
            <NavLink to="/" className={(navData) => (navData.isActive ? 'selected' : '')}>
              All
            </NavLink>
          </li>
          <li>
            <NavLink to="/active" className={(navData) => (navData.isActive ? 'selected' : '')}>
              Active
            </NavLink>
          </li>
          <li>
            <NavLink to="/completed" className={(navData) => (navData.isActive ? 'selected' : '')}>
              Completed
            </NavLink>
          </li>
        </ul>
        {hasCompleted && (
          <button className="clear-completed" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </footer>
    </div>
  )
}
