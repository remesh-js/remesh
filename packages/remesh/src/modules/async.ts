import { merge } from 'rxjs'
import { switchMap, concatMap, mergeMap, exhaustMap } from 'rxjs/operators'

import { RemeshDomainContext, RemeshCommandContext, RemeshCommandOutput, RemeshQueryContext } from '../remesh'

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
  name: string
  query: (context: RemeshQueryContext, arg: T) => Promise<U>
  command?: (context: RemeshCommandContext, arg: AsyncData<U>) => RemeshCommandOutput
  default?: AsyncData<U>
  mode?: 'switch' | 'merge' | 'concat' | 'exhaust'
}

export const AsyncModule = <T, U>(domain: RemeshDomainContext, options: AsyncModuleOptions<T, U>) => {
  const defaultValue: AsyncData<U> = 'default' in options && options.default ? options.default : AsyncData.default()

  const AsyncState = domain.state<AsyncData<U>>({
    name: `${options.name}.AsyncState`,
    default: defaultValue,
  })

  const isType = domain.query({
    name: `${options.name}.isType`,
    inspectable: false,
    impl: ({ get }, type: AsyncData<U>['type']) => {
      const asyncData = get(AsyncState())
      return asyncData.type === type
    },
  })

  const isDefault = domain.query({
    name: `${options.name}.isDefault`,
    impl: ({ get }) => {
      return get(isType('default'))
    },
  })

  const isLoading = domain.query({
    name: `${options.name}.isLoading`,
    impl: ({ get }) => {
      return get(isType('loading'))
    },
  })

  const isSuccess = domain.query({
    name: `${options.name}.isSuccess`,
    impl: ({ get }) => {
      return get(isType('success'))
    },
  })

  const isFailed = domain.query({
    name: `${options.name}.isFailed`,
    impl: ({ get }) => {
      return get(isType('failed'))
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
    if (data.type === 'loading') {
      return [AsyncState().new(data), LoadingEvent(), options.command?.(ctx, data)]
    }

    if (data.type === 'success') {
      return [AsyncState().new(data), SuccessEvent(data.value), options.command?.(ctx, data)]
    }

    if (data.type === 'failed') {
      return [AsyncState().new(data), FailedEvent(data.error), options.command?.(ctx, data)]
    }

    throw new Error(`Unknown async data: ${data}`)
  }

  const load = domain.command$<T>({
    name: `${options.name}.load`,
    impl: ({ get, peek }, arg$) => {
      const ctx = { get, peek }

      const handleArg = (arg: T) => {
        const promise = options.query(ctx, arg)

        const successOrFailed = promise.then(
          (value) => {
            const successAsyncData = AsyncData.success(value)
            return handleAsyncData(ctx, successAsyncData)
          },
          (error) => {
            const errorAsyncData = AsyncData.failed(error instanceof Error ? error : new Error(`${error}`))
            return handleAsyncData(ctx, errorAsyncData as AsyncData<U>)
          },
        )

        const loading = handleAsyncData(ctx, AsyncData.loading(promise))

        return merge(loading, successOrFailed)
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

  return {
    query: {
      asyncState: AsyncState.query,
      isDefault,
      isLoading,
      isSuccess,
      isFailed,
    },
    command: {
      load,
    },
    event: {
      LoadingEvent,
      SuccessEvent,
      FailedEvent,
    },
  }
}
