import React from 'react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { TimerDomain } from 'remesh-domains-for-demos/dist/7guis/Timer'

export const TimerApp = () => {
  const send = useRemeshSend()
  const timerDomain = useRemeshDomain(TimerDomain())
  const elapsed = useRemeshQuery(timerDomain.query.ElapsedQuery())
  const duration = useRemeshQuery(timerDomain.query.DurationQuery())

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(event.target.value, 10)
    if (!isNaN(duration)) {
      send(timerDomain.command.UpdateDurationCommand(duration))
    }
  }

  const handleResetElapsed = () => {
    send(timerDomain.command.ResetElapsedCommand())
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
      <h2>Timer</h2>
      <div style={{ display: 'flex' }}>
        <label style={{ marginRight: 10, whiteSpace: 'nowrap' }}>Elapsed Timer:</label>
        <div style={{ width: '100%' }}>
          <span
            style={{
              display: 'inline-block',
              height: 10,
              background: 'green',
              width: `${Math.min(elapsed / duration, 1) * 100}%`,
              verticalAlign: 'middle',
              borderRadius: 5,
            }}
          ></span>
        </div>
      </div>
      <div>{elapsed > duration ? (duration / 1000).toFixed(1) : (elapsed / 1000).toFixed(1)}s</div>
      <div style={{ display: 'flex' }}>
        <label style={{ width: 100, marginRight: 10 }}>Duration:</label>
        <input
          style={{ width: '100%' }}
          type="range"
          min={0}
          max={30000}
          value={duration}
          onChange={handleDurationChange}
        />
      </div>
      <div>
        <button style={{ width: '100% ' }} onClick={handleResetElapsed}>
          Reset Timer
        </button>
      </div>
    </div>
  )
}
