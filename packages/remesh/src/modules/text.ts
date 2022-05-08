import { RemeshDomainContext } from '../index'

export type TextModuleOptions = {
  name: string
  default?: string
}

export const TextModule = (domain: RemeshDomainContext, options: TextModuleOptions) => {
  const TextState = domain.state({
    name: `${options.name}.TextState`,
    default: options.default ?? '',
  })

  const text = domain.query({
    name: `${options.name}.TextQuery`,
    impl: ({ get }) => get(TextState()),
  })

  const setText = domain.command({
    name: `${options.name}.setText`,
    impl: ( _ , current: string) => {
      return TextState().new(current)
    },
  })

  const clearText = domain.command({
    name: `${options.name}.clearText`,
    impl: () => {
      return setText('')
    },
  })

  const reset = domain.command({
    name: `${options.name}.reset`,
    impl: ( _ ) => {
      return TextState().new(options.default ?? '')
    },
  })

  return {
    query: {
      text,
    },
    command: {
      setText,
      clearText,
      reset,
    },
  }
}
