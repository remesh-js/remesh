import React from "react"
import ReactDOM from "react-dom"
import { RemeshRoot } from "./remesh/react"
import { TodoApp } from "./todo-app"

ReactDOM.render(
  <React.StrictMode>
    <RemeshRoot>
      <TodoApp />
    </RemeshRoot>
  </React.StrictMode>,
  document.getElementById("root")
)

window.ReactDOM = ReactDOM