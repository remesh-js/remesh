import React from 'react';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

import { Remesh } from '../remesh';
import {
  useRemeshDomain,
  useRemeshEmit,
  useRemeshQuery,
} from '../remesh/react';

type FlightBookerOption = 'one-way' | 'return';

type FlightBookerStatus = {
  startDate: 'valid' | 'invalid';
  endDate: 'valid' | 'invalid' | 'disabled' | 'enabled';
  bookButton: 'disabled' | 'enabled';
};

const getDate = (dateInput: string) => {
  const list = dateInput.split('.');

  if (list.length !== 3) {
    return null;
  }

  const date = new Date(`${list[2]}.${list[1]}.${list[0]}`);

  if (date.toString() === 'Invalid Date') {
    return null;
  }

  return date;
};

const toDateInput = (date: Date) => {
  const list = date.toLocaleDateString().split('/');

  return `${list[2]}.${list[1]}.${list[0]}`;
};

const compareDate = (date1: Date, date2: Date) => {
  if (date1.getFullYear() !== date2.getFullYear()) {
    return date1.getFullYear() - date2.getFullYear();
  }

  if (date1.getMonth() !== date2.getMonth()) {
    return date1.getMonth() - date2.getMonth();
  }

  return date1.getDate() - date2.getDate();
};

const FlightBooker = Remesh.domain({
  name: 'FlightBooker',
  impl: (domain) => {
    const OptionState = domain.state<FlightBookerOption>({
      name: 'OptionState',
      default: 'one-way',
    });

    const StartDateInputState = domain.state({
      name: 'StartDateInputState',
      default: toDateInput(new Date()),
    });

    const EndDateInputState = domain.state({
      name: 'EndDateInputState',
      default: toDateInput(new Date()),
    });

    const StartDateQuery = domain.query({
      name: 'StartDateQuery',
      impl: ({ get }) => {
        const startDateInput = get(StartDateInputState());
        return {
          input: startDateInput,
          date: getDate(startDateInput),
        };
      },
    });

    const EndDateQuery = domain.query({
      name: 'EndDateQuery',
      impl: ({ get }) => {
        const endDateInput = get(EndDateInputState());
        return {
          input: endDateInput,
          date: getDate(endDateInput),
        };
      },
    });

    const OptionQuery = domain.query({
      name: 'OptionQuery',
      impl: ({ get }) => {
        return get(OptionState());
      },
    });

    const updateOption = domain.command({
      name: 'updateOption',
      impl: ({}, option: FlightBookerOption) => {
        return OptionState().new(option);
      },
    });

    const updateStartDate = domain.command({
      name: 'updateStartDate',
      impl: ({}, dateInput: string) => {
        return StartDateInputState().new(dateInput);
      },
    });

    const updateEndDate = domain.command({
      name: 'updateEndDate',
      impl: ({}, dateInput: string) => {
        return EndDateInputState().new(dateInput);
      },
    });

    const StatusQuery = domain.query({
      name: 'StatusQuery',
      impl: ({ get }): FlightBookerStatus => {
        const option = get(OptionQuery());
        const startDate = get(StartDateQuery());
        const endDate = get(EndDateQuery());

        const startDateStatus = !!startDate.date ? 'valid' : 'invalid';
        const endDateStatus =
          option === 'return'
            ? !!endDate.date
              ? 'valid'
              : 'invalid'
            : 'disabled';

        const bookButtonStatus =
          option === 'one-way'
            ? startDateStatus === 'valid'
              ? 'enabled'
              : 'disabled'
            : startDateStatus === 'valid' &&
              endDateStatus === 'valid' &&
              !!startDate.date &&
              !!endDate.date &&
              compareDate(startDate.date, endDate.date) <= 0
            ? 'enabled'
            : 'disabled';

        return {
          startDate: startDateStatus,
          endDate: endDateStatus,
          bookButton: bookButtonStatus,
        };
      },
    });

    const task = domain.task({
      name: 'FlightBookerTask',
      impl: ({ fromEvent }) => {
        const updateOption$ = fromEvent(updateOption.Event).pipe(
          map((option) => updateOption(option))
        );

        const updateStartDate$ = fromEvent(updateStartDate.Event).pipe(
          map((dateInput) => updateStartDate(dateInput))
        );

        const updateEndDate$ = fromEvent(updateEndDate.Event).pipe(
          map((dateInput) => updateEndDate(dateInput))
        );

        return merge(updateOption$, updateStartDate$, updateEndDate$);
      },
    });

    return {
      autorun: [task],
      query: {
        StatusQuery,
        OptionQuery,
        StartDateQuery,
        EndDateQuery,
      },
      event: {
        updateOption: updateOption.Event,
        updateStartDate: updateStartDate.Event,
        updateEndDate: updateEndDate.Event,
      },
    };
  },
});

export const FlightBookerApp = () => {
  const flightBooker = useRemeshDomain(FlightBooker);
  const emit = useRemeshEmit();
  const option = useRemeshQuery(flightBooker.query.OptionQuery());
  const startDate = useRemeshQuery(flightBooker.query.StartDateQuery());
  const endDate = useRemeshQuery(flightBooker.query.EndDateQuery());
  const status = useRemeshQuery(flightBooker.query.StatusQuery());

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    emit(
      flightBooker.event.updateOption(event.target.value as FlightBookerOption)
    );
  };

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    emit(flightBooker.event.updateStartDate(event.target.value));
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    emit(flightBooker.event.updateEndDate(event.target.value));
  };

  const handleBookButtonClick = () => {
    if (status.bookButton === 'enabled') {
      if (option === 'one-way') {
        alert(`You have booked a one-way flight on ${startDate.input}`);
      } else {
        alert(
          `You have booked return flight from ${startDate.input} to ${endDate.input}`
        );
      }
    }
  };

  return (
    <div>
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
          value={startDate.input}
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
          value={endDate.input}
          onChange={handleEndDateChange}
        />
      </div>
      <div>
        <button
          disabled={status.bookButton === 'disabled'}
          onClick={handleBookButtonClick}
        >
          Book
        </button>
      </div>
    </div>
  );
};
