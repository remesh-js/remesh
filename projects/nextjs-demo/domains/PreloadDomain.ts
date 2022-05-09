import { Remesh } from 'remesh'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export type State = {
  count: number
}

export const PreloadDomain = Remesh.domain({
  name: 'PreloadDomain',
  impl: (domain) => {
    const CountState = domain.state<State>({
      name: 'CountState',
      default: {
        count: 0,
      },
    })

    const CountQuery = domain.query({
      name: 'CountQuery',
      impl: ({ get }) => {
        return get(CountState())
      }
    })


    const SetCountCommand = domain.command({
      name: 'SetCountCommand',
      impl: ({}, newCount: number) => {
        return CountState().new({ count: newCount })
      },
    })

    const IncreCommand = domain.command({
      name: 'IncreCommand',
      impl: ({ get }) => {
        const state = get(CountState())
        return CountState().new({ count: state.count + 1 })
      },
    })

    const DecreCommand = domain.command({
      name: 'DecreCommand',
      impl: ({ get }) => {
        const state = get(CountState())
        return CountState().new({ count: state.count - 1 })
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
        return SetCountCommand(data.count)
      },
    })

    return {
      query: {
        CountQuery
      },
      command: {
        SetCountCommand: SetCountCommand,
        IncreCommand: IncreCommand,
        DecreCommand: DecreCommand,
      },
    }
  },
})
