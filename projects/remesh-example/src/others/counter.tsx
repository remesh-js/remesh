import React, { Suspense } from 'react'

import { Remesh } from 'remesh'
import { debounce } from 'remesh/schedulers/debounce'
import { useRemeshAsyncQuery, useRemeshDomain, useRemeshQuery, useRemeshSuspenseQuery } from 'remesh-react'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const CounterDomain = Remesh.domain({
  name: 'counter',
  impl: (domain) => {
    const CountState = domain.state({
      name: 'CountState',
      default: 0,
    })

    const CountIncreQuery = domain.query({
      name: 'CountIncreQuery',
      impl: async ({ get }) => {
        const count = get(CountState())
        await delay(200)
        return count + 1
      },
    })

    const CountDecreQuery = domain.query({
      name: 'CountDecreQuery',
      impl: async ({ get }) => {
        const count = get(CountState())
        await delay(200)
        return count - 1
      },
    })

    const CountDoubleQuery = domain.query({
      name: 'CountDoubleQuery',
      impl: async ({ get }) => {
        const count = await get(CountState())
        await delay(200)
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

    const UnwrappedCountQuery = domain.query({
      name: 'UnwrappedCountQuery',
      impl: ({ unwrap }) => {
        const data = unwrap(CountQuery())
        return data
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
        UnwrappedCountQuery,
      },
      command: {
        incre,
        decre,
      },
    }
  },
})

export default () => {
  const counterDomain = useRemeshDomain(CounterDomain())

  const count = useRemeshAsyncQuery(counterDomain.query.CountQuery())
  const unwrappedCount = useRemeshQuery(counterDomain.query.UnwrappedCountQuery())

  return (
    <div>
      <h2>Counter</h2>
      <button onClick={() => counterDomain.command.incre()}>Increment</button>{' '}
      <button onClick={() => counterDomain.command.decre()}>Decrement</button>
      <div>
        <h3>Async Query</h3>
        <pre>{JSON.stringify(count, null, 2)}</pre>
      </div>
      <div>
        <h3>Unwrapped Query</h3>
        <pre>{JSON.stringify(unwrappedCount, null, 2)}</pre>
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
  const counterDomain = useRemeshDomain(CounterDomain())

  const count = useRemeshSuspenseQuery(counterDomain.query.CountQuery())

  return <pre>{JSON.stringify(count, null, 2)}</pre>
}
