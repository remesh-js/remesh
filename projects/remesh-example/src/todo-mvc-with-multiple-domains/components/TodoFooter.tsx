import React, { useEffect } from 'react'
import { NavLink, useParams } from 'react-router-dom'

import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { TodoListDomain } from '../domains/TodoList'
import { TodoFilterDomain } from '../domains/TodoFilter'

export const TodoFooter = () => {
  const todoListDomain = useRemeshDomain(TodoListDomain())
  const todoFilterDomain = useRemeshDomain(TodoFilterDomain())

  const todoFilter = useRemeshQuery(todoFilterDomain.query.todoFilter())
  const activeTodoCount = useRemeshQuery(todoListDomain.query.activeTodoCount())
  const completedTodoCount = useRemeshQuery(todoListDomain.query.completedTodoCount())

  const hasCompleted = completedTodoCount > 0

  const handleClearCompleted = () => {
    todoListDomain.command.clearAllCompletedTodos()
  }

  const getClassName = (navData: { isActive: boolean }) => {
    return navData.isActive ? 'selected' : ''
  }

  const params = useParams<{ filter: string }>()

  useEffect(() => {
    const filter = params.filter ?? 'all'
    if (filter !== todoFilter) {
      todoFilterDomain.command.setFilter(filter)
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
