import { RemeshDomainContext } from '../index'

export type SwitchModuleOptions<T> = {
  name: string
  default: T
}

export const SwitchModule = <T>(domain: RemeshDomainContext, options: SwitchModuleOptions<T>) => {
  const SwitchState = domain.state({
    name: `${options.name}.SwitchState`,
    default: options.default,
  })

  const switchState = domain.query({
    name: `${options.name}.SwitchStateQuery`,
    impl: ({ get }) => get(SwitchState()),
  })

  const switchTo = domain.command({
    name: `${options.name}.switchTo`,
    impl: ({ get }, current: T) => {
      return SwitchState().new(current)
    },
  })

  const reset = domain.command({
    name: `${options.name}.reset`,
    impl: ({}, defaultValue: T) => {
      return SwitchState().new(defaultValue)
    },
  })

  return {
    query: {
      switchState,
    },
    command: {
      switchTo,
      reset,
    },
  }
}
