import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { Counter } from 'remesh-domains-for-demos/dist/7guis/Counter'

export const CounterApp = () => {
  const counter = useRemeshDomain(Counter())
  const count = useRemeshQuery(counter.query.count())

  const handleIncre = () => {
    counter.command.incre()
  }

  return (
    <div
      style={{
        width: 400,
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
    >
      <h2>Counter</h2>
      <input type="number" readOnly value={count} />
      <label>
        <button onClick={handleIncre}>Count </button>{' '}
      </label>
    </div>
  )
}
