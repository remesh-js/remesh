import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Remesh } from 'remesh'
import { RemeshRoot } from 'remesh-react'

import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import App from './App'

const rootElement = document.getElementById('root')
const root = createRoot(rootElement!)

const store = Remesh.store({
  inspectors: [RemeshReduxDevtools(), RemeshLogger()],
})

root.render(
  <StrictMode>
    <RemeshRoot store={store}>
      <App />
    </RemeshRoot>
  </StrictMode>,
)
