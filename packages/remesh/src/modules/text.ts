import { RemeshDomainContext } from '../index'

export type TextModuleOptions = {
  name: string
  default?: string
}

export type TextChangedEventData = {
  previous: string
  current: string
}

export type TextClearedEventData = {
  previous: string
}

export const TextModule = (domain: RemeshDomainContext, options: TextModuleOptions) => {
  const TextState = domain.state({
    name: `${options.name}.TextState`,
    default: options.default ?? '',
  })

  const TextQuery = domain.query({
    name: `${options.name}.InputQuery`,
    impl: ({ get }) => get(TextState()),
  })

  const TextChangedEvent = domain.event<TextChangedEventData>({
    name: `${options.name}.TextChangedEvent`,
  })

  const setText = domain.command({
    name: `${options.name}.setText`,
    impl: ({ get }, current: string) => {
      const previous = get(TextState())

      const result = [TextState().new(current), TextChangedEvent({ previous, current })]

      if (current === '') {
        return [...result, TextClearedEvent({ previous })]
      }

      return result
    },
  })

  const TextClearedEvent = domain.event<TextClearedEventData>({
    name: `${options.name}.InputClearedEvent`,
  })

  const clearText = domain.command({
    name: `${options.name}.clearText`,
    impl: () => {
      return setText('')
    },
  })

  return {
    query: {
      TextQuery,
    },
    command: {
      setText,
      clearText,
    },
    event: {
      TextChangedEvent,
      TextClearedEvent,
    },
  }
}
