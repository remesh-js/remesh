import React from 'react'
import ReactDOM from 'react-dom'

import { HashRouter, Routes, Route } from 'react-router-dom'

import { RemeshRoot } from 'remesh-react'
import { TodoList } from './TodoList'

function Root() {
  return (
    <RemeshRoot>
      <TodoList />
    </RemeshRoot>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <HashRouter basename="/">
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/:filter" element={<Root />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root'),
)
