import { of, concat } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

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

  const load = domain.command$<T>({
    name: `${options.name}.load`,
    impl: ({ get, unwrap, peek, hasNoValue }, arg$) => {
      const ctx = { get, unwrap, peek, hasNoValue }
      return arg$.pipe(
        switchMap((arg) => {
          const promise = options.query(ctx, arg)

          const successOrFailed = promise.then(
            (value) => {
              return AsyncData.success(value)
            },
            (error): AsyncData<U> => {
              return AsyncData.failed(error instanceof Error ? error : new Error(`${error}`))
            },
          )

          return concat(of(AsyncData.loading(promise)), successOrFailed)
        }),
        map((data) => {
          if (data.type === 'loading') {
            return [AsyncState().new(data), options.command?.(ctx, data), LoadingEvent()]
          }

          if (data.type === 'success') {
            return [AsyncState().new(data), options.command?.(ctx, data), SuccessEvent(data.value)]
          }

          if (data.type === 'failed') {
            return [AsyncState().new(data), options.command?.(ctx, data), FailedEvent(data.error)]
          }

          throw new Error(`Unknown async data: ${data}`)
        }),
      )
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
