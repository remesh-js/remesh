import React from 'react'

import { Remesh } from 'remesh'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

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
      impl: ({ get }) => {
        const count = get(CountState())
        return count + 1
      },
    })

    const CountDecreQuery = domain.query({
      name: 'CountDecreQuery',
      impl: ({ get }) => {
        const count = get(CountState())
        return count - 1
      },
    })

    const CountDoubleQuery = domain.query({
      name: 'CountDoubleQuery',
      impl: ({ get }) => {
        const incredCount = get(CountIncreQuery())
        const decredCount = get(CountDecreQuery())
        return 2 * (incredCount + decredCount)
      },
    })

    const countQuery = domain.query({
      name: 'CountQuery',
      impl: ({ get }) => {
        const [incre, decre, double] = [get(CountIncreQuery()), get(CountDecreQuery()), get(CountDoubleQuery())]
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
        count: countQuery,
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

  const count = useRemeshQuery(counterDomain.query.count())

  return (
    <div>
      <h2>Counter</h2>
      <button onClick={() => counterDomain.command.incre()}>Increment</button>{' '}
      <button onClick={() => counterDomain.command.decre()}>Decrement</button>
      <div>
        <h3>Count Query</h3>
        <pre>{JSON.stringify(count, null, 2)}</pre>
      </div>
    </div>
  )
}
