import React from 'react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { FlightBookerDomain, FlightBookerOption } from 'remesh-domains-for-demos/dist/7guis/FlightBooker'

export const FlightBookerApp = () => {
  const send = useRemeshSend()
  const flightBooker = useRemeshDomain(FlightBookerDomain())
  const option = useRemeshQuery(flightBooker.query.OptionQuery())
  const status = useRemeshQuery(flightBooker.query.StatusQuery())

  const startDateInput = useRemeshQuery(flightBooker.query.StartDateInputQuery())
  const endDateInput = useRemeshQuery(flightBooker.query.EndDateInputQuery())

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    send(flightBooker.command.UpdateOptionCommand(event.target.value as FlightBookerOption))
  }

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    send(flightBooker.command.UpdateStartDateCommand(event.target.value))
  }

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    send(flightBooker.command.UpdateEndDateCommand(event.target.value))
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
