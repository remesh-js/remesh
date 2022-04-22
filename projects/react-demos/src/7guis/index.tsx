import React, { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Remesh } from 'remesh'

import { RemeshRoot } from 'remesh-react'

import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { CounterApp } from './Counter'
import { TemperatureConverterApp } from './TemperatureConverter'
import { FlightBookerApp } from './FlightBooker'
import { TimerApp } from './Timer'
import { CRUDApp } from './CRUD'
import { CircleDrawerApp } from './CircleDrawer'
import { CellsApp } from './Cells'

const Root = () => {
  return (
    <div>
      <h1>7GUIs in React/Remesh/TypeScript</h1>
      <p>This is a live version of an implementation (source) of 7GUIs with React, TypeScript and Remesh.</p>
      <hr />
      <CounterApp />
      <hr />
      <TemperatureConverterApp />
      <hr />
      <FlightBookerApp />
      <hr />
      <TimerApp />
      <hr />
      <CRUDApp />
      <hr />
      <CircleDrawerApp />
      <hr />
      <CellsApp />
    </div>
  )
}

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)
  const store = Remesh.store({
    inspectors: [RemeshReduxDevtools(), RemeshLogger()],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <Root />
      </RemeshRoot>
    </StrictMode>,
  )
}
