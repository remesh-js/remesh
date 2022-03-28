import React from 'react'
import ReactDOM from 'react-dom'

import { HashRouter, Routes, Route } from 'react-router-dom'

import { RemeshRoot } from 'remesh-react'

import { RemeshReduxDevtools } from 'remesh-redux-devtools'

import { TodoList } from './TodoList'

function Root() {
  return <TodoList />
}

ReactDOM.render(
  <React.StrictMode>
    <RemeshRoot
      options={{
        inspectors: [RemeshReduxDevtools()],
      }}
    >
      <HashRouter basename="/">
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/:filter" element={<Root />} />
        </Routes>
      </HashRouter>
    </RemeshRoot>
  </React.StrictMode>,
  document.getElementById('root'),
)
