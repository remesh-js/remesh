<script setup lang="ts">
import { useRemeshDomain, useRemeshQuery } from 'remesh-vue'

import { FlightBookerDomain, FlightBookerOption } from 'remesh-domains-for-demos/dist/7guis/FlightBooker'

const flightBookerDomain = useRemeshDomain(FlightBookerDomain())
const option = useRemeshQuery(flightBookerDomain.query.OptionQuery())
const status = useRemeshQuery(flightBookerDomain.query.StatusQuery())

const startDateInput = useRemeshQuery(flightBookerDomain.query.StartDateInputQuery())
const endDateInput = useRemeshQuery(flightBookerDomain.query.EndDateInputQuery())

const handleOptionChange = (event: Event) => {
  flightBookerDomain.command.UpdateOptionCommand((event.target as HTMLSelectElement).value as FlightBookerOption)
}

const handleStartDateChange = (event: Event) => {
  flightBookerDomain.command.UpdateStartDateCommand((event.target as HTMLInputElement).value)
}

const handleEndDateChange = (event: Event) => {
  flightBookerDomain.command.UpdateEndDateCommand((event.target as HTMLInputElement).value)
}

const handleBookButtonClick = () => {
  if (status.value.bookButton === 'enabled') {
    if (option.value === 'one-way') {
      alert(`You have booked a one-way flight on ${startDateInput.value}`)
    } else {
      alert(`You have booked return flight from ${startDateInput.value} to ${endDateInput.value}`)
    }
  }
}
</script>

<template>
  <div
    :style="{
      width: '400px',
      border: '1px solid #eaeaea',
      boxSizing: 'border-box',
      padding: '10px',
    }"
  >
    <h2>Flight Booker</h2>
    <div>
      <select :value="option" @input="handleOptionChange">
        <option value="one-way">One-way flight</option>
        <option value="return">Return flight</option>
      </select>
    </div>
    <div>
      <input
        type="text"
        :style="{
          backgroundColor: status.startDate === 'invalid' ? 'red' : '',
        }"
        :value="startDateInput"
        @input="handleStartDateChange"
      />
    </div>
    <div>
      <input
        type="text"
        :style="{
          backgroundColor: status.endDate === 'invalid' ? 'red' : '',
        }"
        :disabled="status.endDate === 'disabled'"
        :value="endDateInput"
        @input="handleEndDateChange"
      />
    </div>
    <div>
      <button :disabled="status.bookButton === 'disabled'" @click="handleBookButtonClick">Book</button>
    </div>
  </div>
</template>
