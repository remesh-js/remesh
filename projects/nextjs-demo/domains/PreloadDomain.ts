import { Remesh } from 'remesh'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export type State = {
  count: number
}

export const PreloadDomain = Remesh.domain({
  name: 'PreloadDomain',
  impl: (domain) => {
    const State = domain.state<State>({
      name: 'State',
      default: {
        count: 0,
      },
    })

    const setCount = domain.command({
      name: 'setState',
      impl: ({}, newCount: number) => {
        return State().new({ count: newCount })
      },
    })

    const incre = domain.command({
      name: 'incre',
      impl: ({ get }) => {
        const state = get(State())
        return State().new({ count: state.count + 1 })
      },
    })

    const decre = domain.command({
      name: 'decre',
      impl: ({ get }) => {
        const state = get(State())
        return State().new({ count: state.count - 1 })
      },
    })

    domain.preload({
      key: 'preload_count',
      query: async () => {
        await delay(500)
        return {
          count: Math.floor(Math.random() * 100),
        }
      },
      command: ({}, data) => {
        return setCount(data.count)
      },
    })

    return {
      query: {
        state: State.query,
      },
      command: {
        setCount,
        incre,
        decre,
      },
    }
  },
})
