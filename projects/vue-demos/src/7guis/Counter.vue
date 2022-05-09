<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { CounterDomain } from 'remesh-domains-for-demos/dist/7guis/Counter'

const counterDomain = useRemeshDomain(CounterDomain())

const count = useRemeshQuery(counterDomain.query.CountQuery())

const handleIncre = () => {
  counterDomain.command.IncreCommand()
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
    <h2>Counter</h2>
    <input type="number" readonly :value="count" />
    <label>
      <button @click="handleIncre">Count</button>
    </label>
  </div>
</template>
