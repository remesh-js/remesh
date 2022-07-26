import { Remesh } from 'remesh'

export const TemperatureConverterDomain = Remesh.domain({
  name: 'TemperatureConverterDomain',
  impl: (domain) => {
    const CelsiusState = domain.state({
      name: 'CelsiusState',
      default: '',
    })

    const CelsiusQuery = domain.query({
      name: 'CelsiusQuery',
      impl: ({ get }) => {
        return get(CelsiusState())
      },
    })

    const FahrenheitState = domain.state({
      name: 'FahrenheitState',
      default: '',
    })

    const FahrenheitQuery = domain.query({
      name: 'FahrenheitQuery',
      impl: ({ get }) => {
        return get(FahrenheitState())
      },
    })

    const ResetBothCommand = domain.command({
      name: 'ResetBothCommand',
      impl: ({}) => {
        return [CelsiusState().new(''), FahrenheitState().new('')]
      },
    })

    const UpdateCelsiusCommand = domain.command({
      name: 'UpdateCelsiusCommand',
      impl: ({}, input: string) => {
        if (input === '') {
          return ResetBothCommand()
        }

        const celsius = parseFloat(input)

        if (Number.isNaN(celsius)) {
          return CelsiusState().new(input)
        }

        const fahrenheit = celsius * (9 / 5) + 32

        return [CelsiusState().new(input), FahrenheitState().new(fahrenheit.toString())]
      },
    })

    const UpdateFahrenheitCommand = domain.command({
      name: 'UpdateFahrenheitCommand',
      impl: ({}, input: string) => {
        if (input === '') {
          return ResetBothCommand()
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
        CelsiusQuery,
        FahrenheitQuery,
      },
      command: {
        UpdateCelsiusCommand,
        UpdateFahrenheitCommand,
      },
    }
  },
})
