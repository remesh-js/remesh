import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../components';
import { exampleStyle } from './styles.css';

import { interval, combineLatest, EMPTY, NEVER } from 'rxjs';
import { map, switchMap, scan, tap, filter, startWith } from 'rxjs/operators';

import { Remesh } from './remesh';

import {
  RemeshRoot,
  useRemeshValue,
  useRemeshEffect,
  useRemeshEmitter,
} from './remesh/react';

let todoUid = 0;

type Todo = {
  id: number;
  content: string;
  completed: boolean;
};

const Todos = Remesh.atom<Todo[]>({
  defaultValue: [],
}).reducers({
  addTodo: (todos: Todo[], content: string) => {
    const newTodo: Todo = {
      id: todoUid++,
      content,
      completed: false,
    };
    return [...todos, newTodo];
  },
  removeTodo: (todos: Todo[], todoId: number) => {
    return todos.filter((todo) => todo.id !== todoId);
  },
  toggleTodo: (todos: Todo[], todoId: number) => {
    return todos.map((todo) => {
      if (todo.id === todoId) {
        return {
          ...todo,
          completed: !todo.completed,
        };
      }
      return todo;
    });
  },
  clearAllCompleted: (todos: Todo[]) => {
    return todos.filter((todo) => !todo.completed);
  },
});

type TodoFilter = 'All' | 'Active' | 'Completed';

const TodoFilter = Remesh.atom<TodoFilter>({
  defaultValue: 'All',
});

const FilteredTodoList = Remesh.pack<Todo[]>({
  impl: ({ get }) => {
    const todos = get(Todos);
    const filter = get(TodoFilter);

    if (filter === 'Active') {
      return todos.filter((todo) => !todo.completed);
    }

    if (filter === 'Completed') {
      return todos.filter((todo) => todo.completed);
    }

    return todos;
  },
});

type CounterAction = 'incre' | 'decre' | 'reset' | 'noop';

const CounterAction = Remesh.atom<CounterAction>({
  defaultValue: 'noop',
});

const Counter = Remesh.atom({
  defaultValue: 0,
}).reducers({
  incre: (count: number) => {
    return count + 1;
  },
  decre: (count: number) => {
    return count - 1;
  },
  step: (count: number, step = 1) => {
    return count + step;
  },
  reset: () => {
    return 0;
  },
});

type CounterTimerInput =
  | {
      type: 'start';
      period?: number;
    }
  | {
      type: 'stop';
    };

const CounterTimerInput = Remesh.atom<CounterTimerInput>({
  defaultValue: {
    type: 'stop',
  },
}).reducers({
  start: (_: CounterTimerInput, period = 1000): CounterTimerInput => {
    return {
      type: 'start',
      period,
    };
  },
  stop: (): CounterTimerInput => {
    return {
      type: 'stop',
    };
  },
});

const CounterTimer = Remesh.effect({
  impl: ({ get$ }) => {
    return get$(CounterTimerInput).pipe(
      switchMap((action) => {
        if (action.type === 'stop') {
          return NEVER;
        }
        return interval(action.period ?? 1000).pipe(
          map(() => {
            console.log('timer');
            return Counter.actions.incre();
          })
        );
      })
    );
  },
});

const CounterUI = () => {
  const count = useRemeshValue(Counter);
  const emitter = useRemeshEmitter();

  const handleIncre = () => {
    emitter.emit(Counter.actions.incre());
  };

  const handleDecre = () => {
    emitter.emit(Counter.actions.decre());
  };

  const handleReset = () => {
    emitter.emit(Counter.actions.reset());
  };

  const handleStart = () => {
    emitter.emit(CounterTimerInput.actions.start(100));
  };

  const handleStop = () => {
    emitter.emit(CounterTimerInput.actions.stop());
  };

  useRemeshEffect(CounterTimer);

  useEffect(() => {
    if (count >= 100) {
      ReactDOM.unmountComponentAtNode(document.getElementById('root')!);
    }
  }, [count]);

  return (
    <>
      <h2>{count}</h2>
      <Button onClick={handleIncre}>+1</Button>
      <Button onClick={handleDecre}>-1</Button>
      <Button onClick={handleReset}>reset</Button>
      <Button onClick={handleStart}>start</Button>
      <Button onClick={handleStop}>stop</Button>
    </>
  );
};

const TodoListUI = () => {
  const todos = useRemeshValue(FilteredTodoList);
};

ReactDOM.render(
  <React.StrictMode>
    <RemeshRoot
      options={{
        startValues: [Counter.startWith(10)],
      }}
    >
      <div className={exampleStyle}>
        <Button>button</Button>
      </div>
      <CounterUI />
    </RemeshRoot>
  </React.StrictMode>,
  document.getElementById('root')
);

export const a = 1;

export const b = false;
