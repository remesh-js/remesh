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

    const CountInfoQuery = domain.query({
      name: 'CountInfoQuery',
      impl: ({ get }) => {
        const [incre, decre, double] = [get(CountIncreQuery()), get(CountDecreQuery()), get(CountDoubleQuery())]
        return { incre, decre, double }
      },
    })

    const IncreCommand = domain.command({
      name: 'IncreCommand',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count + 1)
      },
    })

    const DecreCommand = domain.command({
      name: 'DecreCommand',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count - 1)
      },
    })

    return {
      query: {
        CountInfoQuery: CountInfoQuery,
      },
      command: {
        IncreCommand: IncreCommand,
        DecreCommand: DecreCommand,
      },
    }
  },
})

export default () => {
  const counterDomain = useRemeshDomain(CounterDomain())

  const countInfo = useRemeshQuery(counterDomain.query.CountInfoQuery())

  return (
    <div>
      <h2>Counter</h2>
      <button onClick={() => counterDomain.command.IncreCommand()}>Increment</button>{' '}
      <button onClick={() => counterDomain.command.DecreCommand()}>Decrement</button>
      <div>
        <h3>Count Query</h3>
        <pre>{JSON.stringify(countInfo, null, 2)}</pre>
      </div>
    </div>
  )
}
