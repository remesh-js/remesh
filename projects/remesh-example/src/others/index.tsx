import React, { StrictMode, Suspense } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Remesh } from 'remesh'

import { debounce } from 'remesh/schedulers/debounce'
import { throttle } from 'remesh/schedulers/throttle'

import { RemeshRoot, useRemeshAsyncQuery, useRemeshDomain, useRemeshSuspenseQuery } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const TestDomain = Remesh.domain({
  name: 'test',
  impl: (domain) => {
    const CountState = domain.state({
      name: 'CountState',
      default: 0,
    })

    const CountIncreQuery = domain.query({
      name: 'CountIncreQuery',
      impl: async ({ get }) => {
        const count = get(CountState())
        await delay(1000)
        return count + 1
      },
    })

    const CountDecreQuery = domain.query({
      name: 'CountDecreQuery',
      impl: async ({ get }) => {
        const count = get(CountState())
        await delay(1000)
        return count - 1
      },
    })

    const CountDoubleQuery = domain.query({
      name: 'CountDoubleQuery',
      impl: async ({ get }) => {
        const count = await get(CountState())
        await delay(1000)
        return count * 2
      },
    })

    const CountQuery = domain.query({
      name: 'CountQuery',
      scheduler: debounce(0),
      impl: async ({ get }) => {
        const [incre, decre, double] = await Promise.all([
          get(CountIncreQuery()),
          get(CountDecreQuery()),
          get(CountDoubleQuery()),
        ])
        return { incre, decre, double }
      },
    })

    const incre = domain.command({
      name: 'incre',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count + 1)
      },
    })

    const decre = domain.command({
      name: 'decre',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count - 1)
      },
    })

    return {
      query: {
        CountQuery,
      },
      command: {
        incre,
        decre,
      },
    }
  },
})

const App = () => {
  const testDomain = useRemeshDomain(TestDomain())
  const count = useRemeshAsyncQuery(testDomain.query.CountQuery())
  return (
    <div>
      <h3>Commands</h3>
      <button onClick={() => testDomain.command.incre()}>Increment</button>{' '}
      <button onClick={() => testDomain.command.decre()}>Decrement</button>
      <div>
        <h3>Async Query</h3>
        <pre>{JSON.stringify(count, null, 2)}</pre>
      </div>
      <div>
        <h3>Suspense Query</h3>
        <Suspense fallback="loading...">
          <Count />
        </Suspense>
      </div>
    </div>
  )
}

const Count = () => {
  const testDomain = useRemeshDomain(TestDomain())

  const count = useRemeshSuspenseQuery(testDomain.query.CountQuery())

  return <pre>{JSON.stringify(count, null, 2)}</pre>
}

const rootElem = document.getElementById('root')

if (rootElem) {
  const root = ReactDOMClient.createRoot(rootElem)
  const store = Remesh.store({
    inspectors: [
      RemeshReduxDevtools(),
      RemeshLogger({
        include: ['command', 'query', 'event', 'domain', 'command$', 'state'],
      }),
    ],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <App />
      </RemeshRoot>
    </StrictMode>,
  )
}
