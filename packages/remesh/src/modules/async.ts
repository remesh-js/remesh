import { fromEvent, merge, Observable, Subscriber, Subscription } from 'rxjs'
import { switchMap, concatMap, mergeMap, exhaustMap, takeUntil } from 'rxjs/operators'

import { Remesh, RemeshDomainContext, RemeshCommandContext, RemeshQueryContext, Capitalize } from '../index'

export type DefaultAsyncData = {
  type: 'default'
}

export type LoadingAsyncData<T> = {
  type: 'loading'
  promise: Promise<T>
}

export type SuccessAsyncData<T> = {
  type: 'success'
  promise: Promise<T>
  value: T
}

export type FailedAsyncData<T> = {
  type: 'failed'
  promise: Promise<T>
  error: Error
}

export type AsyncData<T> = DefaultAsyncData | LoadingAsyncData<T> | SuccessAsyncData<T> | FailedAsyncData<T>

export const AsyncData = {
  default: (): DefaultAsyncData => {
    return {
      type: 'default',
    }
  },
  loading: <T>(promise: Promise<T>): LoadingAsyncData<T> => {
    return {
      type: 'loading',
      promise,
    }
  },
  success: <T>(value: T): SuccessAsyncData<T> => {
    return {
      type: 'success',
      promise: Promise.resolve(value),
      value,
    }
  },
  failed: <T>(error: Error): FailedAsyncData<T> => {
    return {
      type: 'failed',
      promise: Promise.reject(error),
      error,
    }
  },
  isDefault: <T>(data: AsyncData<T>): data is DefaultAsyncData => {
    return data.type === 'default'
  },
  isLoading: <T>(data: AsyncData<T>): data is LoadingAsyncData<T> => {
    return data.type === 'loading'
  },
  isSuccess: <T>(data: AsyncData<T>): data is SuccessAsyncData<T> => {
    return data.type === 'success'
  },
  isFailed: <T>(data: AsyncData<T>): data is FailedAsyncData<T> => {
    return data.type === 'failed'
  },
  assertDefault: <T>(data: AsyncData<T>): asserts data is DefaultAsyncData => {
    if (data.type !== 'default') {
      throw new Error(`Expected async data in default phase, but got '${data.type}'`)
    }
  },
  assertLoading: <T>(data: AsyncData<T>): asserts data is LoadingAsyncData<T> => {
    if (data.type !== 'loading') {
      throw new Error(`Expected async data in loading phase, but got '${data.type}'`)
    }
  },
  assertSuccess: <T>(data: AsyncData<T>): asserts data is SuccessAsyncData<T> => {
    if (data.type !== 'success') {
      throw new Error(`Expected async data in success phase, but got '${data.type}'`)
    }
  },
  assertFailed: <T>(data: AsyncData<T>): asserts data is FailedAsyncData<T> => {
    if (data.type !== 'failed') {
      throw new Error(`Expected async data in failed phase, but got '${data.type}'`)
    }
  },
}

export type AsyncModuleOptions<T, U> = {
  name: Capitalize
  query: (context: RemeshQueryContext, arg: T) => Promise<U>
  command?: (context: RemeshCommandContext, arg: AsyncData<U>) => unknown
  default?: AsyncData<U>
  mode?: 'switch' | 'merge' | 'concat' | 'exhaust'
}

export const AsyncModule = <T, U>(domain: RemeshDomainContext, options: AsyncModuleOptions<T, U>) => {
  const defaultValue: AsyncData<U> = 'default' in options && options.default ? options.default : AsyncData.default()

  const AsyncDataState = domain.state<AsyncData<U>>({
    name: `${options.name}.AsyncDataState`,
    default: defaultValue,
  })

  const AsyncDataQuery = domain.query({
    name: `${options.name}.AsyncDataQuery`,
    impl: ({ get }) => {
      return get(AsyncDataState())
    },
  })

  const LoadingEvent = domain.event({
    name: `${options.name}.LoadingEvent`,
  })

  const SuccessEvent = domain.event<U>({
    name: `${options.name}.SuccessEvent`,
  })

  const FailedEvent = domain.event<Error>({
    name: `${options.name}.FailedEvent`,
  })

  const handleAsyncData = (ctx: RemeshCommandContext, data: AsyncData<U>) => {
    const { set, emit } = ctx

    if (data.type === 'loading') {
      set(AsyncDataState(), data)
      emit(LoadingEvent())
      options.command?.(ctx, data)
      return
    }

    if (data.type === 'success') {
      set(AsyncDataState(), data)
      emit(SuccessEvent(data.value))
      options.command?.(ctx, data)
      return
    }

    if (data.type === 'failed') {
      set(AsyncDataState(), data)
      emit(FailedEvent(data.error))
      options.command?.(ctx, data)
      return
    }

    throw new Error(`Unknown async data: ${data}`)
  }

  const CanceledEvent = domain.event({
    name: `${options.name}.CanceledEvent`,
  })

  const LoadEvent = domain.event<T, AsyncData<U>>({
    name: `${options.name}.LoadEvent`,
    impl: (ctx, arg$) => {
      const handleArg = (arg: T) => {
        return new Observable<AsyncData<U>>((subscriber) => {
          let isUnsubscribed = false

          const promise = options.query(ctx, arg)

          const loadingAsyncData = AsyncData.loading(promise)

          handleAsyncData(ctx, loadingAsyncData)
          subscriber.next(loadingAsyncData)

          promise.then(
            (value) => {
              if (!isUnsubscribed) {
                const successAsyncData = AsyncData.success(value)
                handleAsyncData(ctx, successAsyncData)
                subscriber.next(successAsyncData)
                subscriber.complete()
              }
            },
            (error) => {
              if (!isUnsubscribed) {
                const errorAsyncData = AsyncData.failed<U>(error instanceof Error ? error : new Error(`${error}`))
                handleAsyncData(ctx, errorAsyncData as AsyncData<U>)
                subscriber.next(errorAsyncData)
                subscriber.complete()
              }
            },
          )

          return () => {
            isUnsubscribed = true
          }
        }).pipe(takeUntil(ctx.fromEvent(CanceledEvent)))
      }

      if (!options.mode || options.mode === 'switch') {
        return arg$.pipe(switchMap((arg) => handleArg(arg)))
      }

      if (options.mode === 'concat') {
        return arg$.pipe(concatMap((arg) => handleArg(arg)))
      }

      if (options.mode === 'merge') {
        return arg$.pipe(mergeMap((arg) => handleArg(arg)))
      }

      if (options.mode === 'exhaust') {
        return arg$.pipe(exhaustMap((arg) => handleArg(arg)))
      }

      throw new Error(`RemeshAsyncModule: invalid mode: ${options.mode}`)
    },
  })

  const ArgState = domain.state<void, T>({
    name: `${options.name}.ArgState`,
  })

  const LoadCommand = domain.command({
    name: `${options.name}.LoadCommand`,
    impl: ({ emit, set }, arg: T) => {
      set(ArgState(), arg)
      emit(LoadEvent(arg))
    },
  })

  const CancelCommand = domain.command({
    name: `${options.name}.CancelCommand`,
    impl: ({ emit }) => {
      emit(CanceledEvent())
    },
  })

  const RetryCommand = domain.command({
    name: `${options.name}.RetryCommand`,
    impl: ({ get, send }) => {
      send(LoadCommand(get(ArgState())))
    },
  })

  return Remesh.module({
    query: {
      AsyncDataQuery,
    },
    command: {
      LoadCommand,
      CancelCommand,
      RetryCommand,
    },
    event: {
      CanceledEvent: CanceledEvent.toSubscribeOnlyEvent(),
      LoadingEvent: LoadEvent.toSubscribeOnlyEvent(),
      SuccessEvent: SuccessEvent.toSubscribeOnlyEvent(),
      FailedEvent: FailedEvent.toSubscribeOnlyEvent(),
    },
  })
}
