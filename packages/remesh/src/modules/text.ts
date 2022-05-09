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

  const TextQuery = domain.query({
    name: `${options.name}.TextQuery`,
    impl: ({ get }) => get(TextState()),
  })

  const SetTextCommand = domain.command({
    name: `${options.name}.SetTextCommand`,
    impl: (_, current: string) => {
      return TextState().new(current)
    },
  })

  const ClearTextCommand = domain.command({
    name: `${options.name}.ClearTextCommand`,
    impl: () => {
      return TextState().new('')
    },
  })

  const ResetCommand = domain.command({
    name: `${options.name}.ResetCommand`,
    impl: () => {
      return TextState().new(options.default ?? '')
    },
  })

  return {
    query: {
      TextQuery,
    },
    command: {
      SetTextCommand,
      ClearTextCommand,
      ResetCommand,
    },
  }
}
