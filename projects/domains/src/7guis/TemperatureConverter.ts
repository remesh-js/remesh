import { Remesh } from 'remesh'

export const TemperatureConverter = Remesh.domain({
  name: 'TemperatureConverter',
  impl: (domain) => {
    const CelsiusState = domain.state({
      name: 'CelsiusState',
      default: '',
    })

    const FahrenheitState = domain.state({
      name: 'FahrenheitState',
      default: '',
    })

    const resetBoth = domain.command({
      name: 'resetBoth',
      impl: () => {
        return [CelsiusState().new(''), FahrenheitState().new('')]
      },
    })

    const updateCelsius = domain.command({
      name: 'updateCelsius',
      impl: ({}, input: string) => {
        if (input === '') {
          return resetBoth()
        }

        const celsius = parseFloat(input)

        if (Number.isNaN(celsius)) {
          return CelsiusState().new(input)
        }

        const fahrenheit = celsius * (9 / 5) + 32

        return [CelsiusState().new(input), FahrenheitState().new(fahrenheit.toString())]
      },
    })

    const updateFahrenheit = domain.command({
      name: 'updateFahrenheit',
      impl: ({}, input: string) => {
        if (input === '') {
          return resetBoth()
        }

        const fahrenheit = parseFloat(input)

        if (Number.isNaN(fahrenheit)) {
          return FahrenheitState().new(input)
        }

        const celsius = (fahrenheit - 32) * (5 / 9)

        return [CelsiusState().new(celsius.toString()), FahrenheitState().new(input)]
      },
    })

    return {
      query: {
        celsius: CelsiusState.query,
        fahrenheit: FahrenheitState.query,
      },
      command: {
        updateCelsius: updateCelsius,
        updateFahrenheit: updateFahrenheit,
      },
    }
  },
})
