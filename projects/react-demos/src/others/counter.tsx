import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { CounterDomain } from 'remesh-domains-for-demos/dist/others/counter'

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
