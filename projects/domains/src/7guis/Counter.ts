import { Remesh } from 'remesh'

export const CounterDomain = Remesh.domain({
  name: 'CounterDomain',
  impl: (domain) => {
    const CountState = domain.state({
      name: 'CounterState',
      default: 0,
    })

    const CountQuery = domain.query({
      name: 'CounterQuery',
      impl: ({ get }) => {
        return get(CountState())
      },
    })

    const IncreCommand = domain.command({
      name: 'IncreCommand',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count + 1)
      },
    })

    return {
      query: {
        CountQuery,
      },
      command: {
        IncreCommand,
      },
    }
  },
})
