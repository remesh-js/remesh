import React, { StrictMode, useState, useEffect, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import { Remesh } from 'remesh'

import { RemeshRoot } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash.substring(1))

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash.substring(1))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  })

  return hash
}

const CounterApp = React.lazy(() => import('./counter'))
const PaginationApp = React.lazy(() => import('./pagination'))

const ComponentMap = {
  counter: CounterApp,
  pagination: PaginationApp,
}

const Menu = () => {
  return (
    <ul>
      <li>
        <a href={import.meta.env.BASE_URL}>Home</a>
      </li>
      <li>
        <a href="#counter">Counter</a>
      </li>
      <li>
        <a href="#pagination">Pagination</a>
      </li>
    </ul>
  )
}

const storeOptions = {
  inspectors: [
    RemeshReduxDevtools(),
    RemeshLogger({
      include: ['command', 'query', 'event', 'domain', 'command$', 'state'],
    }),
  ],
}

const App = () => {
  const hash = useHash()
  const Component = ComponentMap[hash || 'pagination']

  return (
    <div>
      <Menu />
      <Suspense fallback="loading...">
        {!!Component && (
          <RemeshRoot key={hash} options={storeOptions}>
            <Component />
          </RemeshRoot>
        )}
        {!Component && 'Not Found'}
      </Suspense>
    </div>
  )
}

const rootElem = document.getElementById('root')

if (rootElem) {
  const root = createRoot(rootElem)
  const store = Remesh.store()

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
