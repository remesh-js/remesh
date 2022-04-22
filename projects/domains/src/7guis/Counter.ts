import { Remesh } from 'remesh';

export const Counter = Remesh.domain({
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