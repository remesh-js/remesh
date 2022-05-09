<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'
import { TemperatureConverterDomain } from 'remesh-domains-for-demos/dist/7guis/TemperatureConverter'

const domain = useRemeshDomain(TemperatureConverterDomain())
const celsius = useRemeshQuery(domain.query.CelsiusQuery())
const fahrenheit = useRemeshQuery(domain.query.FahrenheitQuery())

const handleCelsius = (event: Event) => {
  domain.command.UpdateCelsiusCommand((event.target as HTMLInputElement).value)
}

const handleFahrenheit = (event: Event) => {
  domain.command.UpdateFahrenheitCommand((event.target as HTMLInputElement).value)
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
