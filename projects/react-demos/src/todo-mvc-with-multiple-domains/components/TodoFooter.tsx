import React, { useEffect } from 'react'
import { NavLink, useParams } from 'react-router-dom'

import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { TodoListDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoList'
import { TodoFilterDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoFilter'

export const TodoFooter = () => {
  const send = useRemeshSend()
  const todoListDomain = useRemeshDomain(TodoListDomain())
  const todoFilterDomain = useRemeshDomain(TodoFilterDomain())

  const todoFilter = useRemeshQuery(todoFilterDomain.query.TodoFilterQuery())
  const activeTodoCount = useRemeshQuery(todoListDomain.query.ActiveTodoCountQuery())
  const completedTodoCount = useRemeshQuery(todoListDomain.query.CompletedTodoCountQuery())

  const hasCompleted = completedTodoCount > 0

  const handleClearCompleted = () => {
    send(todoListDomain.command.ClearAllCompletedCommand())
  }

  const getClassName = (navData: { isActive: boolean }) => {
    return navData.isActive ? 'selected' : ''
  }

  const params = useParams<{ filter: string }>()

  useEffect(() => {
    const filter = params.filter ?? 'all'
    if (filter !== todoFilter) {
      send(todoFilterDomain.command.SetFilterCommand(filter))
    }
  }, [params, todoFilter])

  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{activeTodoCount}</strong> item{activeTodoCount !== 1 && 's'} left
      </span>
      <ul className="filters">
        <li>
          <NavLink to="/" className={getClassName}>
            All
          </NavLink>
        </li>
        <li>
          <NavLink to="/active" className={getClassName}>
            Active
          </NavLink>
        </li>
        <li>
          <NavLink to="/completed" className={getClassName}>
            Completed
          </NavLink>
        </li>
      </ul>
      {hasCompleted && (
        <button className="clear-completed" onClick={handleClearCompleted}>
          Clear completed
        </button>
      )}
    </footer>
  )
}
