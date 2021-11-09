import React from 'react';
import ReactDOM from 'react-dom';

import { RemeshRoot } from '../remesh/react';

import { CounterApp } from './Counter';
import { TemperatureConverterApp } from './TemperatureConverter';
import { FlightBookerApp } from './FlightBooker';
import { TimerApp } from './Timer';
import { CRUDApp } from './CRUD';

const Root = () => {
  return (
    <div>
      <h1>7GUIs in React/TypeScript/Remesh</h1>
      <p>
        This is a live version of an implementation (source) of 7GUIs with
        React, TypeScript and Remesh.
      </p>
      <hr />
      <CounterApp />
      <hr />
      <TemperatureConverterApp />
      <hr />
      <FlightBookerApp />
      <hr />
      <TimerApp />
      <hr />
      <CRUDApp />
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <RemeshRoot>
      <Root />
    </RemeshRoot>
  </React.StrictMode>,
  document.getElementById('root')
);
