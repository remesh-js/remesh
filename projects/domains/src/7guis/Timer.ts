import { merge, animationFrames, of, NEVER } from 'rxjs'

import { distinctUntilChanged, map, tap, pairwise, switchMap, takeUntil, startWith } from 'rxjs/operators'

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
      impl: ({ get, set, emit }, increment: number) => {
        const duration = get(DurationState())
        const elapsed = get(ElapsedState())

        if (elapsed > duration) {
          emit(StopEvent())
          return
        }

        set(ElapsedState(), elapsed + increment)
      },
    })

    const UpdateDurationCommand = domain.command({
      name: 'UpdateDurationCommand',
      impl: ({ get, set, emit }, newDuration: number) => {
        const elapsed = get(ElapsedState())

        if (newDuration > elapsed) {
          set(DurationState(), newDuration)
          emit(StartEvent())
          return
        }

        set(DurationState(), newDuration)
      },
    })

    const ResetElapsedCommand = domain.command({
      name: 'ResetElapsedCommand',
      impl: ({ set, emit }) => {
        set(ElapsedState(), 0)
        emit(StartEvent())
      },
    })

    const UpdateElapsedByAnimationFramesCommand = domain.command$({
      name: 'UpdateElapsedByAnimationFramesCommand',
      impl: ({ fromEvent, send }) => {
        const startEvent$ = fromEvent(StartEvent).pipe(
          startWith(StartEvent()),
          map(() => 1),
        )
        const stopEvent$ = fromEvent(StopEvent).pipe(map(() => 0))

        return merge(startEvent$, stopEvent$).pipe(
          distinctUntilChanged(),
          switchMap((signal) => {
            if (signal === 0) {
              return NEVER
            }
            return animationFrames().pipe(
              pairwise(),
              map(([a, b]) => b.elapsed - a.elapsed),
              tap((increment) => {
                send(UpdateElapsedCommand(increment))
              }),
              takeUntil(fromEvent(StopEvent)),
            )
          }),
        )
      },
    })

    domain.ignite(({ send }) => {
      send(UpdateElapsedByAnimationFramesCommand())
    })

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
