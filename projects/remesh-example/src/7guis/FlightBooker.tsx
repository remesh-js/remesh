import React from 'react'

import { Remesh } from 'remesh'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

type FlightBookerOption = 'one-way' | 'return'

type FlightBookerStatus = {
  startDate: 'valid' | 'invalid'
  endDate: 'valid' | 'invalid' | 'disabled' | 'enabled'
  bookButton: 'disabled' | 'enabled'
}

const getDate = (dateInput: string) => {
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

const toDateInput = (date: Date) => {
  const list = date.toLocaleDateString().split('/')

  return `${list[2]}.${list[1]}.${list[0]}`
}

const compareDate = (date1: Date, date2: Date) => {
  if (date1.getFullYear() !== date2.getFullYear()) {
    return date1.getFullYear() - date2.getFullYear()
  }

  if (date1.getMonth() !== date2.getMonth()) {
    return date1.getMonth() - date2.getMonth()
  }

  return date1.getDate() - date2.getDate()
}

const FlightBooker = Remesh.domain({
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

export const FlightBookerApp = () => {
  const flightBooker = useRemeshDomain(FlightBooker())
  const option = useRemeshQuery(flightBooker.query.option())
  const status = useRemeshQuery(flightBooker.query.status())

  const startDateInput = useRemeshQuery(flightBooker.query.startDateInput())
  const endDateInput = useRemeshQuery(flightBooker.query.endDateInput())

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    flightBooker.command.updateOption(event.target.value as FlightBookerOption)
  }

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    flightBooker.command.updateStartDate(event.target.value)
  }

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    flightBooker.command.updateEndDate(event.target.value)
  }

  const handleBookButtonClick = () => {
    if (status.bookButton === 'enabled') {
      if (option === 'one-way') {
        alert(`You have booked a one-way flight on ${startDateInput}`)
      } else {
        alert(`You have booked return flight from ${startDateInput} to ${endDateInput}`)
      }
    }
  }

  return (
    <div
      style={{
        width: 400,
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
    >
      <h2>Flight Booker</h2>
      <div>
        <select value={option} onChange={handleOptionChange}>
          <option value="one-way">One-way flight</option>
          <option value="return">Return flight</option>
        </select>
      </div>
      <div>
        <input
          type="text"
          style={{
            backgroundColor: status.startDate === 'invalid' ? 'red' : '',
          }}
          value={startDateInput}
          onChange={handleStartDateChange}
        />
      </div>
      <div>
        <input
          type="text"
          style={{
            backgroundColor: status.endDate === 'invalid' ? 'red' : '',
          }}
          disabled={status.endDate === 'disabled'}
          value={endDateInput}
          onChange={handleEndDateChange}
        />
      </div>
      <div>
        <button disabled={status.bookButton === 'disabled'} onClick={handleBookButtonClick}>
          Book
        </button>
      </div>
    </div>
  )
}
