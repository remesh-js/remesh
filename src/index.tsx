import React from "react"
import ReactDOM from "react-dom"
import { RemeshRoot } from "./remesh/react"

import { TodoListExtern } from "./todo-remise-app/domains/todoList"
import { Todo } from "./todo-remise-app/domains/todoApp"
import { TodoAppRoot } from "./todo-remise-app"

const initialTodoList: Todo[] = [
  {
    id: -1,
    content: "learn remesh",
    completed: true,
  },
]

ReactDOM.render(
  <React.StrictMode>
    <RemeshRoot
      options={{
        name: "TodoAppStore",
        externs: [TodoListExtern(initialTodoList)],
      }}
    >
      <TodoAppRoot />
    </RemeshRoot>
  </React.StrictMode>,
  document.getElementById("root")
)

window.ReactDOM = ReactDOM
