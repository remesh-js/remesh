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
      impl: ({ set }) => {
        set(CelsiusState(), '')
        set(FahrenheitState(), '')
      },
    })

    const UpdateCelsiusCommand = domain.command({
      name: 'UpdateCelsiusCommand',
      impl: ({ set, send }, input: string) => {
        if (input === '') {
          send(ResetBothCommand())
          return
        }

        const celsius = parseFloat(input)

        if (Number.isNaN(celsius)) {
          set(CelsiusState(), input)
          return
        }

        const fahrenheit = celsius * (9 / 5) + 32

        set(CelsiusState(), input)
        set(FahrenheitState(), fahrenheit.toString())
      },
    })

    const UpdateFahrenheitCommand = domain.command({
      name: 'UpdateFahrenheitCommand',
      impl: ({ set }, input: string) => {
        if (input === '') {
          return ResetBothCommand()
        }

        const fahrenheit = parseFloat(input)

        if (Number.isNaN(fahrenheit)) {
          set(FahrenheitState(), input)
          return
        }

        const celsius = (fahrenheit - 32) * (5 / 9)

        set(CelsiusState(), celsius.toString())
        set(FahrenheitState(), input)
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
