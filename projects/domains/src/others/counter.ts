import { Remesh } from 'remesh'

export const CounterDomain = Remesh.domain({
  name: 'CounterDomain',
  impl: (domain) => {
    const CountState = domain.state({
      name: 'CountState',
      default: 0,
    })

    const CountIncreQuery = domain.query({
      name: 'CountIncreQuery',
      impl: ({ get }) => {
        const count = get(CountState())
        return count + 1
      },
    })

    const CountDecreQuery = domain.query({
      name: 'CountDecreQuery',
      impl: ({ get }) => {
        const count = get(CountState())
        return count - 1
      },
    })

    const CountDoubleQuery = domain.query({
      name: 'CountDoubleQuery',
      impl: ({ get }) => {
        const incredCount = get(CountIncreQuery())
        const decredCount = get(CountDecreQuery())
        return 2 * (incredCount + decredCount)
      },
    })

    const CountInfoQuery = domain.query({
      name: 'CountInfoQuery',
      impl: ({ get }) => {
        const [incre, decre, double] = [get(CountIncreQuery()), get(CountDecreQuery()), get(CountDoubleQuery())]
        return { incre, decre, double }
      },
    })

    const IncreCommand = domain.command({
      name: 'IncreCommand',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count + 1)
      },
    })

    const DecreCommand = domain.command({
      name: 'DecreCommand',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count - 1)
      },
    })

    return {
      query: {
        CountInfoQuery,
      },
      command: {
        IncreCommand,
        DecreCommand,
      },
    }
  },
})
