import { Remesh, RemeshDomainContext, Capitalize } from '../index'

export type SwitchModuleOptions<T> = {
  name: Capitalize
  default: T
}

export const SwitchModule = <T>(domain: RemeshDomainContext, options: SwitchModuleOptions<T>) => {
  const SwitchState = domain.state({
    name: `${options.name}.SwitchState`,
    default: options.default,
  })

  const SwitchQuery = domain.query({
    name: `${options.name}.SwitchQuery`,
    impl: ({ get }) => get(SwitchState()),
  })

  const SwitchCommand = domain.command({
    name: `${options.name}.SwitchCommand`,
    impl: ({}, current: T) => {
      return SwitchState().new(current)
    },
  })

  const ResetCommand = domain.command({
    name: `${options.name}.ResetCommand`,
    impl: ({}) => {
      return SwitchState().new(options.default)
    },
  })

  return Remesh.module({
    query: {
      SwitchQuery,
    },
    command: {
      SwitchCommand,
      ResetCommand,
    },
  })
}
