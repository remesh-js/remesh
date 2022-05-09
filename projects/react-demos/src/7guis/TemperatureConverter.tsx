import React from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { TemperatureConverterDomain } from 'remesh-domains-for-demos/dist/7guis/TemperatureConverter'

export const TemperatureConverterApp = () => {
  const domain = useRemeshDomain(TemperatureConverterDomain())
  const celsius = useRemeshQuery(domain.query.CelsiusQuery())
  const fahrenheit = useRemeshQuery(domain.query.FahrenheitQuery())

  const handleCelsius = (event: React.ChangeEvent<HTMLInputElement>) => {
    domain.command.UpdateCelsiusCommand(event.target.value)
  }

  const handleFahrenheit = (event: React.ChangeEvent<HTMLInputElement>) => {
    domain.command.UpdateFahrenheitCommand(event.target.value)
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
