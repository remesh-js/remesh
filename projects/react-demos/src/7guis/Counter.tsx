import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { CounterDomain } from 'remesh-domains-for-demos/dist/7guis/Counter'

export const CounterApp = () => {
  const send = useRemeshSend()
  const counterDomain = useRemeshDomain(CounterDomain())
  const count = useRemeshQuery(counterDomain.query.CountQuery())

  const handleIncre = () => {
    send(counterDomain.command.IncreCommand())
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
