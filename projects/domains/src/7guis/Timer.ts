import { merge, animationFrames, of, NEVER } from 'rxjs'

import { distinctUntilChanged, map, mapTo, pairwise, switchMap, takeUntil } from 'rxjs/operators'

import { Remesh } from 'remesh'

export const TimerDomain = Remesh.domain({
  name: 'TimerDomain',
  inspectable: false,
  impl: (domain) => {
    const DurationState = domain.state({
      name: 'DurationState',
      default: 15000,
    })

    const DurationQuery = domain.query({
      name: 'DurationQuery',
      impl: ({ get }) => {
        return get(DurationState())
      },
    })

    const ElapsedState = domain.state({
      name: 'ElapsedState',
      default: 0,
    })

    const ElapsedQuery = domain.query({
      name: 'ElapsedQuery',
      impl: ({ get }) => {
        return get(ElapsedState())
      },
    })

    const StartEvent = domain.event({
      name: 'StartEvent',
    })

    const StopEvent = domain.event({
      name: 'StopEvent',
    })

    const UpdateElapsedCommand = domain.command({
      name: 'UpdateElapsedCommand',
      impl: ({ get }, increment: number) => {
        const duration = get(DurationState())
        const elapsed = get(ElapsedState())

        if (elapsed > duration) {
          return StopEvent()
        }

        return ElapsedState().new(elapsed + increment)
      },
    })

    const UpdateDurationCommand = domain.command({
      name: 'UpdateDurationCommand',
      impl: ({ get }, newDuration: number) => {
        const elapsed = get(ElapsedState())

        if (newDuration > elapsed) {
          return [DurationState().new(newDuration), StartEvent()]
        }

        return DurationState().new(newDuration)
      },
    })

    const ResetElapsedCommand = domain.command({
      name: 'resetElapsed',
      impl: ({}) => {
        return [ElapsedState().new(0), StartEvent()]
      },
    })

    const UpdateElapsedCommand$ = domain.command$({
      name: 'UpdateElapsedCommand$',
      impl: ({ fromEvent }) => {
        const startEvent$ = fromEvent(StartEvent).pipe(map(() => 1))
        const stopEvent$ = fromEvent(StopEvent).pipe(map(() => 0))

        const main$ = merge(startEvent$, stopEvent$).pipe(
          distinctUntilChanged(),
          switchMap((signal) => {
            if (signal === 0) {
              return NEVER
            }
            return animationFrames().pipe(
              pairwise(),
              map(([a, b]) => b.elapsed - a.elapsed),
              map((increment) => UpdateElapsedCommand(increment)),
              takeUntil(fromEvent(StopEvent)),
            )
          }),
        )

        return merge(main$, of(StartEvent()))
      },
    })

    domain.ignite(() => UpdateElapsedCommand$())

    return {
      query: {
        DurationQuery,
        ElapsedQuery,
      },
      command: {
        ResetElapsedCommand,
        UpdateDurationCommand,
      },
    }
  },
})
