<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { TemperatureConverter } from 'remesh-domains-for-demos/dist/7guis/TemperatureConverter'

const temperatureConverter = useRemeshDomain(TemperatureConverter())
const celsius = useRemeshQuery(temperatureConverter.query.celsius())
const fahrenheit = useRemeshQuery(temperatureConverter.query.fahrenheit())

const handleCelsius = (event: Event) => {
  temperatureConverter.command.updateCelsius((event.target as HTMLInputElement).value)
}

const handleFahrenheit = (event: Event) => {
  temperatureConverter.command.updateFahrenheit((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div
    :style="{
      border: '1px solid #eaeaea',
      boxSizing: 'border-box',
      padding: '10px',
    }"
  >
    <h2>Temperature Converter</h2>
    <div>
      <input type="text" :value="celsius" @input="handleCelsius" />
      <label for="">Celsius</label>=
      <input type="text" :value="fahrenheit" @input="handleFahrenheit" />
      <label for="">Fahrenheit</label>
    </div>
  </div>
</template>
