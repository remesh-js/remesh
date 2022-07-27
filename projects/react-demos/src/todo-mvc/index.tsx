import React, { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Remesh } from 'remesh'
import { HashRouter, Routes, Route } from 'react-router-dom'

import { RemeshRoot } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { TodoList } from './TodoList'
import { TodoRepoExternImpl } from './todoRepo'

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)
  const store = Remesh.store({
    externs: [TodoRepoExternImpl],
    inspectors: [RemeshReduxDevtools(), RemeshLogger()],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<TodoList />} />
            <Route path="/:filter" element={<TodoList />} />
          </Routes>
        </HashRouter>
      </RemeshRoot>
    </StrictMode>,
  )
}
