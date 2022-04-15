import React from 'react';

import { Remesh } from 'remesh';
import { useRemeshDomain, useRemeshQuery } from "remesh-react";

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

    return {
      query: {
        celsius: CelsiusState.query,
        fahrenheit: FahrenheitState.query,
      },
      command: {
        updateCelsius: updateCelsius,
        updateFahrenheit: updateFahrenheit,
      },
    };
  },
});

export const TemperatureConverterApp = () => {
  const temperatureConverter = useRemeshDomain(TemperatureConverter());
  const celsius = useRemeshQuery(temperatureConverter.query.celsius());
  const fahrenheit = useRemeshQuery(
    temperatureConverter.query.fahrenheit()
  );

  const handleCelsius = (event: React.ChangeEvent<HTMLInputElement>) => {
    temperatureConverter.command.updateCelsius(event.target.value);
  };

  const handleFahrenheit = (event: React.ChangeEvent<HTMLInputElement>) => {
    temperatureConverter.command.updateFahrenheit(event.target.value);
  };

  return (
    <div
      style={{
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
    >
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
