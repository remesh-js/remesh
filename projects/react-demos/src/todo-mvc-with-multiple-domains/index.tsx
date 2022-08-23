import React, { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { HashRouter, Routes, Route } from 'react-router-dom'

import { Remesh } from 'remesh'
import { RemeshRoot } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { StorageImpl } from './domain-externs-impl/storage'
import { TodoApp } from './components/TodoApp'

import * as Y from 'yjs'
import { RemeshYjs, RemeshYjsExtern } from 'remesh-yjs'
import { WebrtcProvider } from 'y-webrtc'

const doc = new Y.Doc()

const webrtcProvider = new WebrtcProvider('remesh-todo-app', doc)

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)
  const store = Remesh.store({
    externs: [StorageImpl, RemeshYjsExtern.impl({ doc })],
    inspectors: [],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <HashRouter basename="/">
          <Routes>
            <Route path="/" element={<TodoApp />} />
            <Route path="/:filter" element={<TodoApp />} />
          </Routes>
        </HashRouter>
      </RemeshRoot>
    </StrictMode>,
  )

  // @ts-ignore
  window.root = root
}
