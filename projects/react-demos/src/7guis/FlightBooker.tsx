import React from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { FlightBooker, FlightBookerOption } from 'remesh-domains-for-demos/dist/7guis/FlightBooker'

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
