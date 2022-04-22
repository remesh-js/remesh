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

export const FlightBooker = Remesh.domain({
  name: 'FlightBooker',
  impl: (domain) => {
    const OptionState = domain.state<FlightBookerOption>({
      name: 'OptionState',
      default: 'one-way',
    })

    const StartDateInputState = domain.state({
      name: 'StartDateInputState',
      default: toDateInput(new Date()),
    })

    const EndDateInputState = domain.state({
      name: 'EndDateInputState',
      default: toDateInput(new Date()),
    })

    const startDateQuery = domain.query({
      name: 'StartDateQuery',
      impl: ({ get }) => {
        const startDateInput = get(StartDateInputState())
        return getDate(startDateInput)
      },
    })

    const endDateQuery = domain.query({
      name: 'EndDateQuery',
      impl: ({ get }) => {
        const endDateInput = get(EndDateInputState())
        return getDate(endDateInput)
      },
    })

    const updateOption = domain.command({
      name: 'updateOption',
      impl: ({}, option: FlightBookerOption) => {
        return OptionState().new(option)
      },
    })

    const updateStartDate = domain.command({
      name: 'updateStartDate',
      impl: ({}, dateInput: string) => {
        return StartDateInputState().new(dateInput)
      },
    })

    const updateEndDate = domain.command({
      name: 'updateEndDate',
      impl: ({}, dateInput: string) => {
        return EndDateInputState().new(dateInput)
      },
    })

    const status = domain.query({
      name: 'StatusQuery',
      impl: ({ get }): FlightBookerStatus => {
        const option = get(OptionState())
        const startDate = get(startDateQuery())
        const endDate = get(endDateQuery())

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
        status: status,
        option: OptionState.query,
        startDate: startDateQuery,
        endDate: endDateQuery,
        startDateInput: StartDateInputState.query,
        endDateInput: EndDateInputState.query,
      },
      command: {
        updateOption: updateOption,
        updateStartDate: updateStartDate,
        updateEndDate: updateEndDate,
      },
    }
  },
})
