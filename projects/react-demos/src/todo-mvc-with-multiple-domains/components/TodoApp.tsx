import React from 'react'

import { TodoHeader } from './TodoHeader'
import { TodoList } from './TodoList'
import { TodoFooter } from './TodoFooter'

export const TodoApp = () => {
  return (
    <div className="todoapp">
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </div>
  )
}
