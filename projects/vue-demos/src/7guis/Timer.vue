<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'

import { TimerDomain } from 'remesh-domains-for-demos/dist/7guis/Timer'

const timerDomain = useRemeshDomain(TimerDomain())
const elapsed = useRemeshQuery(timerDomain.query.ElapsedQuery())
const duration = useRemeshQuery(timerDomain.query.DurationQuery())

const handleDurationChange = (event: Event) => {
  const duration = parseInt((event.target as HTMLInputElement).value, 10)
  if (!isNaN(duration)) {
    timerDomain.command.UpdateDurationCommand(duration)
  }
}

const handleResetElapsed = () => {
  timerDomain.command.ResetElapsedCommand()
}
</script>

<template>
  <div
    :style="{
      width: '400px',
      border: '1px solid #eaeaea',
      boxSizing: 'border-box',
      padding: '10px',
    }"
  >
    <h2>Timer</h2>
    <div :style="{ display: 'flex' }">
      <label :style="{ marginRight: '10px', whiteSpace: 'nowrap' }">Elapsed Timer:</label>
      <div :style="{ width: '100%' }">
        <span
          :style="{
            display: 'inline-block',
            height: '10px',
            background: 'green',
            width: `${Math.min(elapsed / duration, 1) * 100}%`,
            verticalAlign: 'middle',
            borderRadius: '5px',
          }"
        ></span>
      </div>
    </div>
    <div>{{ elapsed > duration ? (duration / 1000).toFixed(1) : (elapsed / 1000).toFixed(1) }}s</div>
    <div :style="{ display: 'flex' }">
      <label :style="{ width: '100px', marginRight: '10px' }">Duration:</label>
      <input
        :style="{ width: '100%' }"
        type="range"
        min="0"
        max="30000"
        :value="duration"
        @input="handleDurationChange"
      />
    </div>
    <div>
      <button :style="{ width: '100% ' }" @click="handleResetElapsed">Reset Timer</button>
    </div>
  </div>
</template>
