import { Remesh } from 'remesh'

export const CounterDomain = Remesh.domain({
  name: 'counter',
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

    const countQuery = domain.query({
      name: 'CountQuery',
      impl: ({ get }) => {
        const [incre, decre, double] = [get(CountIncreQuery()), get(CountDecreQuery()), get(CountDoubleQuery())]
        return { incre, decre, double }
      },
    })

    const incre = domain.command({
      name: 'incre',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count + 1)
      },
    })

    const decre = domain.command({
      name: 'decre',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count - 1)
      },
    })

    return {
      query: {
        count: countQuery,
      },
      command: {
        incre,
        decre,
      },
    }
  },
})
