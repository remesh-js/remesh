import React from 'react';
import { map } from 'rxjs/operators';

import { Remesh } from '../remesh';
import {
  useRemeshDomain,
  useRemeshEmit,
  useRemeshQuery,
} from '../remesh/react';

const Counter = Remesh.domain({
  name: 'Counter',
  impl: (domain) => {
    const CounterState = domain.state({
      name: 'CounterState',
      default: 0,
    });

    const CounterQuery = domain.query({
      name: 'CounterQuery',
      impl: ({ get }) => {
        return get(CounterState());
      },
    });

    const incre = domain.command({
      name: 'increCommand',
      impl: ({ get }) => {
        const count = get(CounterQuery());
        return CounterState().new(count + 1);
      },
    });

    const CounterTask = domain.task({
      name: 'CounterTask',
      impl: ({ fromEvent }) => {
        return fromEvent(incre.Event).pipe(map(() => incre()));
      },
    });

    return {
      autorun: [CounterTask],
      query: {
        CounterQuery,
      },
      event: {
        incre: incre.Event,
      },
    };
  },
});

export const CounterApp = () => {
  const counter = useRemeshDomain(Counter);
  const count = useRemeshQuery(counter.query.CounterQuery());

  const emit = useRemeshEmit();

  const handleIncre = () => {
    emit(counter.event.incre());
  };

  return (
    <div>
      <h2>Counter</h2>
      <input type="number" readOnly value={count} />
      <label>
        <button onClick={handleIncre}>Count </button>{' '}
      </label>
    </div>
  );
};
