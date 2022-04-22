import React from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { Timer } from 'remesh-domains-for-demos/dist/7guis/Timer'

export const TimerApp = () => {
  const timer = useRemeshDomain(Timer())
  const elapsed = useRemeshQuery(timer.query.elapsed())
  const duration = useRemeshQuery(timer.query.duration())

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(event.target.value, 10)
    if (!isNaN(duration)) {
      timer.command.updateDuration(duration)
    }
  }

  const handleResetElapsed = () => {
    timer.command.resetElapsed()
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
