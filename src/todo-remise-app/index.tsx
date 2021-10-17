import React from "react"

import { RemiseProvider } from "../remise"

import { TodoApp } from "./View"
import {
  TodoHeaderImpl,
  TodoFooterImpl,
  TodoListImpl,
  TodoItemImpl,
} from "./ViewImpl"

const implList = [TodoHeaderImpl, TodoFooterImpl, TodoListImpl, TodoItemImpl]

export const TodoAppRoot = () => {
  return (
    <RemiseProvider list={implList}>
      <TodoApp />
    </RemiseProvider>
  )
}
