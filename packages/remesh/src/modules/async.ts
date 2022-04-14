import { of, concat } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

import { RemeshDomainContext, RemeshCommandContext, RemeshCommandOutput, RemeshQueryContext } from '../remesh'

export type PendingPromiseData<T> = {
  type: 'pending'
  promise?: Promise<T>
  previous?: T
}

export type ResolvedPromiseData<T> = {
  type: 'resolved'
  promise: Promise<T>
  value: T
}

export type RejectedPromiseData<T> = {
  type: 'rejected'
  promise: Promise<T>
  error: Error
}

export type PromiseData<T> = PendingPromiseData<T> | ResolvedPromiseData<T> | RejectedPromiseData<T>

export type AsyncModuleOptions<T, U> = {
  name: string
  query: (context: RemeshQueryContext, arg: T) => Promise<U>
  command?: (context: RemeshCommandContext, arg: PromiseData<U>) => RemeshCommandOutput
  initialArg?: T
  default?: U
}

export const AsyncModule = <T, U>(domain: RemeshDomainContext, options: AsyncModuleOptions<T, U>) => {
  const AsyncState = domain.state<PromiseData<U>>({
    name: `${options.name}.AsyncState`,
    default:
      'default' in options && options.default
        ? {
            type: 'resolved',
            promise: Promise.resolve(options.default),
            value: options.default,
          }
        : {
            type: 'pending',
          },
  })

  const PendingEvent = domain.event<U | undefined>({
    name: `${options.name}.PendingEvent`,
  })

  const ResolvedEvent = domain.event<U>({
    name: `${options.name}.ResolvedEvent`,
  })

  const RejectedEvent = domain.event<Error>({
    name: `${options.name}.RejectedEvent`,
  })

  const load = domain.command$<T>({
    name: `${options.name}.load`,
    impl: ({ get, unwrap, peek, hasNoValue }, arg$) => {
      const ctx = { get, unwrap, peek, hasNoValue }
      return arg$.pipe(
        switchMap((arg) => {
          const promise = options.query(ctx, arg)
          return concat(
            of({ type: 'pending', promise } as PromiseData<U>),
            promise.then(
              (value): PromiseData<U> => {
                return {
                  type: 'resolved',
                  promise,
                  value,
                }
              },
              (error): PromiseData<U> => {
                return {
                  type: 'rejected',
                  promise,
                  error: error instanceof Error ? error : new Error(`${error}`),
                }
              },
            ),
          )
        }),
        map((data) => {
          if (data.type === 'pending') {
            const currentData = get(AsyncState())
            if (currentData.type === 'resolved') {
              data = {
                type: 'pending',
                promise: data.promise,
                previous: currentData.value,
              }
            } else if (currentData.type === 'pending') {
              data = {
                type: 'pending',
                promise: data.promise,
                previous: currentData.previous,
              }
            }
            return [AsyncState().new(data), options.command?.(ctx, data), PendingEvent(data.previous)]
          }

          if (data.type === 'resolved') {
            return [AsyncState().new(data), options.command?.(ctx, data), ResolvedEvent(data.value)]
          }

          if (data.type === 'rejected') {
            return [AsyncState().new(data), options.command?.(ctx, data), RejectedEvent(data.error)]
          }

          throw new Error(`Unknown promise data: ${data}`)
        }),
      )
    },
  })

  if (options.initialArg) {
    const initialArg = options.initialArg
    domain.command$({
      name: `${options.name}.initialize`,
      impl: () => {
        return of(load(initialArg))
      },
    })
  }

  return {
    query: {
      AsyncQuery: AsyncState.Query,
    },
    command: {
      load,
    },
    event: {
      PendingEvent,
      ResolvedEvent,
      RejectedEvent,
    },
  }
}
