import { RemeshDomainContext } from '../index'

export type SwitchModuleOptions<T> = {
  name: string
  default: T
}

export type SwitchedEventData<T> = {
  previous: T
  current: T
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

  const SwitchedEvent = domain.event<SwitchedEventData<T>>({
    name: `${options.name}.SwitchedEvent`,
  })

  const switchTo = domain.command({
    name: `${options.name}.switchTo`,
    impl: ({ get }, current: T) => {
      const previous = get(SwitchState())

      const result = [SwitchState().new(current), SwitchedEvent({ previous, current })]

      return result
    },
  })

  return {
    query: {
      SwitchQuery,
    },
    command: {
      switchTo,
    },
    event: {
      SwitchedEvent,
    },
  }
}
