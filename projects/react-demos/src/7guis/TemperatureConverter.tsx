import React from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { TemperatureConverter } from 'remesh-domains-for-demos/dist/7guis/TemperatureConverter'

export const TemperatureConverterApp = () => {
  const temperatureConverter = useRemeshDomain(TemperatureConverter())
  const celsius = useRemeshQuery(temperatureConverter.query.celsius())
  const fahrenheit = useRemeshQuery(temperatureConverter.query.fahrenheit())

  const handleCelsius = (event: React.ChangeEvent<HTMLInputElement>) => {
    temperatureConverter.command.updateCelsius(event.target.value)
  }

  const handleFahrenheit = (event: React.ChangeEvent<HTMLInputElement>) => {
    temperatureConverter.command.updateFahrenheit(event.target.value)
  }

  return (
    <div
      style={{
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
    >
      <h2>Temperature Converter</h2>
      <div>
        <input type="text" value={celsius} onChange={handleCelsius} />
        <label htmlFor="">Celsius</label>=
        <input type="text" value={fahrenheit} onChange={handleFahrenheit} />
        <label htmlFor="">Fahrenheit</label>
      </div>
    </div>
  )
}
