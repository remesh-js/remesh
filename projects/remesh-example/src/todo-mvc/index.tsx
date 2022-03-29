import React from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { HashRouter, Routes, Route } from 'react-router-dom'

import { RemeshRoot } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { TodoList } from './TodoList'

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)
  root.render(
    <RemeshRoot
      options={{
        inspectors: [RemeshReduxDevtools(), RemeshLogger()],
      }}
    >
      <HashRouter basename="/">
        <Routes>
          <Route path="/" element={<TodoList />} />
          <Route path="/:filter" element={<TodoList />} />
        </Routes>
      </HashRouter>
    </RemeshRoot>,
  )
}
