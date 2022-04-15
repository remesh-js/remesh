import React from 'react';

import { Remesh } from 'remesh';
import {
  useRemeshDomain,
  useRemeshQuery,
} from "remesh-react";

const Counter = Remesh.domain({
  name: 'Counter',
  impl: (domain) => {
    const CounterState = domain.state({
      name: 'CounterState',
      default: 0,
    });

    const incre = domain.command({
      name: 'increCommand',
      impl: ({ get }) => {
        const count = get(CounterState());
        return CounterState().new(count + 1);
      },
    });

    return {
      query: {
        count: CounterState.query,
      },
      command: {
        incre,
      },
    };
  },
});

export const CounterApp = () => {
  const counter = useRemeshDomain(Counter());
  const count = useRemeshQuery(counter.query.count());

  const handleIncre = () => {
    counter.command.incre();
  };

  return (
    <div
      style={{
        width: 400,
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
    >
      <h2>Counter</h2>
      <input type="number" readOnly value={count} />
      <label>
        <button onClick={handleIncre}>Count </button>{' '}
      </label>
    </div>
  );
};
