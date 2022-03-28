import React from 'react';
import { merge, animationFrames, of, NEVER } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  mapTo,
  pairwise,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import { Remesh } from 'remesh';

import {
  useRemeshDomain,
  useRemeshQuery,
} from "remesh-react";

const Timer = Remesh.domain({
  name: 'timer',
  inspectable: false,
  impl: (domain) => {
    const DurationState = domain.state({
      name: 'duration',
      default: 15000,
    });

    const ElapsedState = domain.state({
      name: 'elapsed',
      default: 0,
    });

    const StartEvent = domain.event({
      name: 'StartEvent',
    });

    const StopEvent = domain.event({
      name: 'StopEvent',
    });

    const updateElapsed = domain.command({
      name: 'updateElapsed',
      impl: ({ get }, increment: number) => {
        const duration = get(DurationState());
        const elapsed = get(ElapsedState());

        if (elapsed > duration) {
          return StopEvent();
        }

        return ElapsedState().new(elapsed + increment);
      },
    });

    const updateDuration = domain.command({
      name: 'updateDuration',
      impl: ({ get }, newDuration: number) => {
        const elapsed = get(ElapsedState());

        if (newDuration > elapsed) {
          return [DurationState().new(newDuration), StartEvent()];
        }

        return DurationState().new(newDuration);
      },
    });

    const resetElapsed = domain.command({
      name: 'resetElapsed',
      impl: ({}) => {
        return [ElapsedState().new(0), StartEvent()];
      },
    });

    domain.command$({
      name: 'updateElapsed$',
      impl: ({ fromEvent }) => {
        const event$ = merge(
          fromEvent(StartEvent).pipe(mapTo(1)),
          fromEvent(StopEvent).pipe(mapTo(0))
        ).pipe(distinctUntilChanged());

        const main$ = event$.pipe(
          switchMap((signal) => {
            if (signal === 0) {
              return NEVER;
            }
            return animationFrames().pipe(
              pairwise(),
              map(([a, b]) => b.elapsed - a.elapsed),
              map((increment) => updateElapsed(increment)),
              takeUntil(fromEvent(StopEvent))
            );
          })
        );

        return merge(main$, of(StartEvent()));
      },
    });

    return {
      query: {
        DurationQuery: DurationState.Query,
        ElapsedQuery: ElapsedState.Query,
      },
      command: {
        resetElapsed,
        updateDuration,
      },
    };
  },
});

export const TimerApp = () => {
  const timer = useRemeshDomain(Timer());
  const elapsed = useRemeshQuery(timer.query.ElapsedQuery());
  const duration = useRemeshQuery(timer.query.DurationQuery());

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(event.target.value, 10);
    if (!isNaN(duration)) {
      timer.command.updateDuration(duration);
    }
  };

  const handleResetElapsed = () => {
    timer.command.resetElapsed();
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
      <h2>Timer</h2>
      <div style={{ display: 'flex' }}>
        <label style={{ marginRight: 10, whiteSpace: 'nowrap' }}>
          Elapsed Timer:
        </label>
        <div style={{ width: '100%' }}>
          <span
            style={{
              display: 'inline-block',
              height: 10,
              background: 'green',
              width: `${Math.min(elapsed / duration, 1) * 100}%`,
              verticalAlign: 'middle',
              borderRadius: 5,
            }}
          ></span>
        </div>
      </div>
      <div>
        {elapsed > duration
          ? (duration / 1000).toFixed(1)
          : (elapsed / 1000).toFixed(1)}
        s
      </div>
      <div style={{ display: 'flex' }}>
        <label style={{ width: 100, marginRight: 10 }}>Duration:</label>
        <input
          style={{ width: '100%' }}
          type="range"
          min={0}
          max={30000}
          value={duration}
          onChange={handleDurationChange}
        />
      </div>
      <div>
        <button style={{ width: '100% ' }} onClick={handleResetElapsed}>
          Reset Timer
        </button>
      </div>
    </div>
  );
};
