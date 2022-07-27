import { useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { NavLink, useParams } from 'react-router-dom'

import { TodoDomain } from 'remesh-domains-for-demos/dist/todo-mvc'
import { useInputHandler, useKeyPressHandler } from './hooks'
import { TodoItem } from './TodoItem'

type FilterType = 'completed' | 'active' | undefined

export const TodoList = () => {
  const send = useRemeshSend()
  const { filter } = useParams()

  const domain = useRemeshDomain(TodoDomain())

  const todoList = useRemeshQuery(domain.query.TodoListQuery(filter as FilterType))
  const activeTodoCount = useRemeshQuery(domain.query.ActiveTodoCountQuery())
  const hasCompleted = useRemeshQuery(domain.query.HasCompletedQuery())
  const allCompleted = useRemeshQuery(domain.query.AllCompletedQuery())

  const [newTodo, handleTodoNameInput, setNewTodo] = useInputHandler('')

  const handlePressEnter = useKeyPressHandler('Enter', () => {
    send(domain.command.AddTodoCommand(newTodo))
    setNewTodo('')
  })

  const handleToggleAll = () => {
    send(domain.command.ToggleAllTodoCompletedCommand(!allCompleted))
  }

  const handleClearCompleted = () => {
    send(domain.command.ClearCompletedCommand())
  }

  useRemeshEvent(domain.event.AddTodoFailedEvent, (message) => {
    alert(message)
  })

  console.log('render list')

  return (
    <div className="todoapp">
      <header className="header">
        <h1>todos</h1>
        <input
          className="new-todo"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={handleTodoNameInput}
          onKeyDown={handlePressEnter}
        />
      </header>

      <section className="main">
        <input
          id="toggle-all"
          type="checkbox"
          className="toggle-all"
          checked={allCompleted}
          onChange={handleToggleAll}
        />
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
          <button className="clear-completed" onClick={handleClearCompleted}>
            Clear completed
          </button>
        )}
      </footer>
    </div>
  )
}
