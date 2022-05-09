import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { TodoAppDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoApp'
import { TodoListDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoList'

import { TodoItem } from './TodoItem'

export const TodoList = () => {
  const todoAppDomain = useRemeshDomain(TodoAppDomain())
  const filteredTodoKeyList = useRemeshQuery(todoAppDomain.query.FilteredTodoKeyListQuery())

  console.log('render list')

  return (
    <section className="main">
      <ToggleAllInput />
      <ul className="todo-list">
        {filteredTodoKeyList.map((todoId) => (
          <TodoItem key={todoId} id={todoId} />
        ))}
      </ul>
    </section>
  )
}

const ToggleAllInput = () => {
  const todoListDomain = useRemeshDomain(TodoListDomain())
  const isAllCompleted = useRemeshQuery(todoListDomain.query.IsAllCompletedQuery())

  const handleToggleAll = () => {
    todoListDomain.command.ToggleAllCommand()
  }
  return (
    <>
      <input
        id="toggle-all"
        type="checkbox"
        className="toggle-all"
        checked={isAllCompleted}
        onChange={handleToggleAll}
      />
      <label htmlFor="toggle-all" />
    </>
  )
}
