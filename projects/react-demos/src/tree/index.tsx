import React, { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Remesh } from 'remesh'
import { HashRouter, Routes, Route } from 'react-router-dom'

import { RemeshRoot } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { TreeApp } from './TreeApp'

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)
  const store = Remesh.store({
    inspectors: [RemeshReduxDevtools(), RemeshLogger()],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <TreeApp />
      </RemeshRoot>
    </StrictMode>,
  )
}
