import React from 'react';
import { merge } from 'rxjs';
import { map } from 'rxjs/operators';

import { Remesh } from '../remesh';
import {
  useRemeshDomain,
  useRemeshEmit,
  useRemeshQuery,
} from '../remesh/react';

const TemperatureConverter = Remesh.domain({
  name: 'TemperatureConverter',
  impl: (domain) => {
    const CelsiusState = domain.state({
      name: 'CelsiusState',
      default: '',
    });

    const FahrenheitState = domain.state({
      name: 'FahrenheitState',
      default: '',
    });

    const CelsiusQuery = domain.query({
      name: 'CelsiusQuery',
      impl: ({ get }) => {
        return get(CelsiusState());
      },
    });

    const FahrenheitQuery = domain.query({
      name: 'FahrenheitQuery',
      impl: ({ get }) => {
        return get(FahrenheitState());
      },
    });

    const resetBoth = domain.command({
      name: 'resetBoth',
      impl: () => {
        return [CelsiusState().new(''), FahrenheitState().new('')];
      },
    });

    const updateCelsius = domain.command({
      name: 'updateCelsius',
      impl: ({}, input: string) => {
        if (input === '') {
          return resetBoth();
        }

        const celsius = parseFloat(input);

        if (Number.isNaN(celsius)) {
          return CelsiusState().new(input);
        }

        const fahrenheit = celsius * (9 / 5) + 32;

        return [
          CelsiusState().new(input),
          FahrenheitState().new(fahrenheit.toString()),
        ];
      },
    });

    const updateFahrenheit = domain.command({
      name: 'updateFahrenheit',
      impl: ({}, input: string) => {
        if (input === '') {
          return resetBoth();
        }

        const fahrenheit = parseFloat(input);

        if (Number.isNaN(fahrenheit)) {
          return FahrenheitState().new(input);
        }

        const celsius = (fahrenheit - 32) * (5 / 9);

        return [
          CelsiusState().new(celsius.toString()),
          FahrenheitState().new(input),
        ];
      },
    });

    const task = domain.task({
      name: 'TemperatureConverterTask',
      impl: ({ fromEvent }) => {
        const updateCelsius$ = fromEvent(updateCelsius.Event).pipe(
          map((input) => updateCelsius(input))
        );

        const updateFahrenheit$ = fromEvent(updateFahrenheit.Event).pipe(
          map((input) => updateFahrenheit(input))
        );

        return merge(updateCelsius$, updateFahrenheit$);
      },
    });

    return {
      autorun: [task],
      query: {
        CelsiusQuery,
        FahrenheitQuery,
      },
      event: {
        updateCelsius: updateCelsius.Event,
        updateFahrenheit: updateFahrenheit.Event,
      },
    };
  },
});

export const TemperatureConverterApp = () => {
  const temperatureConverter = useRemeshDomain(TemperatureConverter);
  const celsius = useRemeshQuery(temperatureConverter.query.CelsiusQuery());
  const fahrenheit = useRemeshQuery(
    temperatureConverter.query.FahrenheitQuery()
  );
  const emit = useRemeshEmit();

  const handleCelsius = (event: React.ChangeEvent<HTMLInputElement>) => {
    emit(temperatureConverter.event.updateCelsius(event.target.value));
  };

  const handleFahrenheit = (event: React.ChangeEvent<HTMLInputElement>) => {
    emit(temperatureConverter.event.updateFahrenheit(event.target.value));
  };

  return (
    <div>
      <h2>Temperature Converter</h2>
      <div>
        <input type="text" value={celsius} onChange={handleCelsius} />
        <label htmlFor="">Celsius</label>=
        <input type="text" value={fahrenheit} onChange={handleFahrenheit} />
        <label htmlFor="">Fahrenheit</label>
      </div>
    </div>
  );
};
