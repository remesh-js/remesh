import React from "react"

import { RemiseProvider } from "../remise"

import { TodoApp } from "./View.headless"

import {
  TodoHeaderImpl,
  TodoFooterImpl,
  TodoListImpl,
  TodoItemImpl,
} from "./View.impl"

const implList = [TodoHeaderImpl, TodoFooterImpl, TodoListImpl, TodoItemImpl]

export const TodoAppRoot = () => {
  return (
    <RemiseProvider list={implList}>
      <TodoApp />
    </RemiseProvider>
  )
}
