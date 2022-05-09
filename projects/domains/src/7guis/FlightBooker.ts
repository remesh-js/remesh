import { Remesh } from 'remesh'

export type FlightBookerOption = 'one-way' | 'return'

export type FlightBookerStatus = {
  startDate: 'valid' | 'invalid'
  endDate: 'valid' | 'invalid' | 'disabled' | 'enabled'
  bookButton: 'disabled' | 'enabled'
}

export const getDate = (dateInput: string) => {
  const list = dateInput.split('.')

  if (list.length !== 3) {
    return null
  }

  const date = new Date(`${list[2]}.${list[1]}.${list[0]}`)

  if (date.toString() === 'Invalid Date') {
    return null
  }

  return date
}

export const toDateInput = (date: Date) => {
  const list = date.toLocaleDateString().split('/')

  return `${list[2]}.${list[1]}.${list[0]}`
}

export const compareDate = (date1: Date, date2: Date) => {
  if (date1.getFullYear() !== date2.getFullYear()) {
    return date1.getFullYear() - date2.getFullYear()
  }

  if (date1.getMonth() !== date2.getMonth()) {
    return date1.getMonth() - date2.getMonth()
  }

  return date1.getDate() - date2.getDate()
}

export const FlightBookerDomain = Remesh.domain({
  name: 'FlightBookerDomain',
  impl: (domain) => {
    const OptionState = domain.state<FlightBookerOption>({
      name: 'OptionState',
      default: 'one-way',
    })

    const OptionQuery = domain.query({
      name: 'OptionQuery',
      impl: ({ get }) => {
        return get(OptionState())
      },
    })

    const StartDateInputState = domain.state({
      name: 'StartDateInputState',
      default: toDateInput(new Date()),
    })

    const StartDateInputQuery = domain.query({
      name: 'StartDateInputQuery',
      impl: ({ get }) => {
        return get(StartDateInputState())
      },
    })

    const EndDateInputState = domain.state({
      name: 'EndDateInputState',
      default: toDateInput(new Date()),
    })

    const EndDateInputQuery = domain.query({
      name: 'EndDateInputQuery',
      impl: ({ get }) => {
        return get(EndDateInputState())
      },
    })

    const StartDateQuery = domain.query({
      name: 'StartDateQuery',
      impl: ({ get }) => {
        const startDateInput = get(StartDateInputState())
        return getDate(startDateInput)
      },
    })

    const EndDateQuery = domain.query({
      name: 'EndDateQuery',
      impl: ({ get }) => {
        const endDateInput = get(EndDateInputState())
        return getDate(endDateInput)
      },
    })

    const UpdateOptionCommand = domain.command({
      name: 'UpdateOptionCommand',
      impl: ({}, option: FlightBookerOption) => {
        return OptionState().new(option)
      },
    })

    const UpdateStartDateCommand = domain.command({
      name: 'UpdateStartDateCommand',
      impl: ({}, dateInput: string) => {
        return StartDateInputState().new(dateInput)
      },
    })

    const UpdateEndDateCommand = domain.command({
      name: 'UpdateEndDateCommand',
      impl: ({}, dateInput: string) => {
        return EndDateInputState().new(dateInput)
      },
    })

    const StatusQuery = domain.query({
      name: 'StatusQuery',
      impl: ({ get }): FlightBookerStatus => {
        const option = get(OptionState())
        const startDate = get(StartDateQuery())
        const endDate = get(EndDateQuery())

        const startDateStatus = !!startDate ? 'valid' : 'invalid'
        const endDateStatus = option === 'return' ? (!!endDate ? 'valid' : 'invalid') : 'disabled'

        const bookButtonStatus =
          option === 'one-way'
            ? !!startDate
              ? 'enabled'
              : 'disabled'
            : !!startDate && !!endDate && compareDate(startDate, endDate) <= 0
            ? 'enabled'
            : 'disabled'

        return {
          startDate: startDateStatus,
          endDate: endDateStatus,
          bookButton: bookButtonStatus,
        }
      },
    })

    return {
      query: {
        StatusQuery,
        OptionQuery,
        StartDateQuery,
        EndDateQuery,
        StartDateInputQuery,
        EndDateInputQuery,
      },
      command: {
        UpdateOptionCommand,
        UpdateStartDateCommand,
        UpdateEndDateCommand,
      },
    }
  },
})
