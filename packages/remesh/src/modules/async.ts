import { Observable } from 'rxjs'
import { concatMap, exhaustMap, mergeMap, switchMap, takeUntil } from 'rxjs/operators'

import {
  Capitalize,
  Remesh,
  RemeshAction,
  RemeshDomainContext,
  RemeshEffectContext,
  RemeshQueryContext,
} from '../index'

export type DefaultAsyncData = {
  type: 'default'
}

export type LoadingAsyncData = {
  type: 'loading'
}

export type SuccessAsyncData<T> = {
  type: 'success'
  value: T
}

export type FailedAsyncData = {
  type: 'failed'
  error: Error
}

export type CanceledAsyncData = {
  type: 'canceled'
}

export type AsyncData<T> =
  | DefaultAsyncData
  | LoadingAsyncData
  | SuccessAsyncData<T>
  | FailedAsyncData
  | CanceledAsyncData

export const AsyncData = {
  default: (): DefaultAsyncData => {
    return {
      type: 'default',
    }
  },
  loading: (): LoadingAsyncData => {
    return {
      type: 'loading',
    }
  },
  success: <T>(value: T): SuccessAsyncData<T> => {
    return {
      type: 'success',
      promise: Promise.resolve(value),
      value,
    }
  },
  failed: (error: Error): FailedAsyncData => {
    return {
      type: 'failed',
      promise: Promise.reject(error),
      error,
    }
  },
  canceled: (): CanceledAsyncData => {
    return {
      type: 'canceled',
    }
  },
  isDefault: <T>(data: AsyncData<T>): data is DefaultAsyncData => {
    return data.type === 'default'
  },
  isLoading: <T>(data: AsyncData<T>): data is LoadingAsyncData => {
    return data.type === 'loading'
  },
  isSuccess: <T>(data: AsyncData<T>): data is SuccessAsyncData<T> => {
    return data.type === 'success'
  },
  isFailed: <T>(data: AsyncData<T>): data is FailedAsyncData => {
    return data.type === 'failed'
  },
  isCanceled: <T>(data: AsyncData<T>): data is CanceledAsyncData => {
    return data.type === 'canceled'
  },
  assertDefault: <T>(data: AsyncData<T>): asserts data is DefaultAsyncData => {
    if (data.type !== 'default') {
      throw new Error(`Expected async data in default phase, but got '${data.type}'`)
    }
  },
  assertLoading: <T>(data: AsyncData<T>): asserts data is LoadingAsyncData => {
    if (data.type !== 'loading') {
      throw new Error(`Expected async data in loading phase, but got '${data.type}'`)
    }
  },
  assertSuccess: <T>(data: AsyncData<T>): asserts data is SuccessAsyncData<T> => {
    if (data.type !== 'success') {
      throw new Error(`Expected async data in success phase, but got '${data.type}'`)
    }
  },
  assertFailed: <T>(data: AsyncData<T>): asserts data is FailedAsyncData => {
    if (data.type !== 'failed') {
      throw new Error(`Expected async data in failed phase, but got '${data.type}'`)
    }
  },
  assertCanceled: <T>(data: AsyncData<T>): asserts data is CanceledAsyncData => {
    if (data.type !== 'canceled') {
      throw new Error(`Expected async data in canceled phase, but got '${data.type}'`)
    }
  },
}

export type AsyncModuleContext = {
  get: RemeshEffectContext['get']
}

export type AsyncModuleOptions<T, U> = {
  name: Capitalize
  load: (context: RemeshQueryContext, arg: T) => Promise<U>
  onLoading?: (context: AsyncModuleContext) => RemeshAction
  onSuccess?: (context: AsyncModuleContext, value: U) => RemeshAction
  onFailed?: (context: AsyncModuleContext, error: Error) => RemeshAction
  onCanceled?: (context: AsyncModuleContext) => RemeshAction
  onChange?: (context: AsyncModuleContext, data: AsyncData<U>) => RemeshAction
  default?: AsyncData<U>
  mode?: 'switch' | 'merge' | 'concat' | 'exhaust'
}

export const AsyncModule = <T, U>(domain: RemeshDomainContext, options: AsyncModuleOptions<T, U>) => {
  const defaultValue: AsyncData<U> = 'default' in options && options.default ? options.default : AsyncData.default()

  const AsyncDataState = domain.state<AsyncData<U>>({
    name: `${options.name}.AsyncDataState`,
    default: defaultValue,
  })

  const UpdateAsyncDataCommand = domain.command({
    name: `${options.name}.UpdateAsyncDataCommand`,
    impl: ({}, data: AsyncData<U>) => {
      return AsyncDataState().new(data)
    },
  })

  const AsyncDataQuery = domain.query({
    name: `${options.name}.AsyncDataQuery`,
    impl: ({ get }) => {
      return get(AsyncDataState())
    },
  })

  const ArgPlaceholder = Symbol('arg')

  const ArgState = domain.state<T | typeof ArgPlaceholder>({
    name: `${options.name}.ArgState`,
    inspectable: false,
    default: ArgPlaceholder,
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

  const CanceledEvent = domain.event({
    name: `${options.name}.CanceledEvent`,
  })

  const LoadCommand = domain.command({
    name: `${options.name}.LoadCommand`,
    impl: ({ get }, arg: T) => {
      const data = AsyncData.loading()
      return [
        ArgState().new(arg),
        UpdateAsyncDataCommand(AsyncData.loading()),
        LoadingEvent(),
        options.onLoading?.({ get }) ?? null,
        options.onChange?.({ get }, data) ?? null,
      ]
    },
  })

  const SuccessCommand = domain.command({
    name: `${options.name}.SuccessCommand`,
    impl: ({ get }, value: U) => {
      const data = AsyncData.success(value)
      return [
        UpdateAsyncDataCommand(data),
        SuccessEvent(value),
        options.onSuccess?.({ get }, value) ?? null,
        options.onChange?.({ get }, data) ?? null,
      ]
    },
  })

  const FailedCommand = domain.command({
    name: `${options.name}.FailedCommand`,
    impl: ({ get }, error: Error) => {
      const data = AsyncData.failed(error)
      return [
        UpdateAsyncDataCommand(data),
        FailedEvent(error),
        options.onFailed?.({ get }, error) ?? null,
        options.onChange?.({ get }, data) ?? null,
      ]
    },
  })

  const CancelCommand = domain.command({
    name: `${options.name}.CancelCommand`,
    impl: ({ get }) => {
      const currentData = get(AsyncDataQuery())

      if (!AsyncData.isLoading(currentData)) {
        return null
      }

      const data = AsyncData.canceled()
      return [
        UpdateAsyncDataCommand(data),
        CanceledEvent(),
        options.onCanceled?.({ get }) ?? null,
        options.onChange?.({ get }, data) ?? null,
      ]
    },
  })

  const ReloadCommand = domain.command({
    name: `${options.name}.ReloadCommand`,
    impl: ({ get }) => {
      const arg = get(ArgState())

      if (arg === ArgPlaceholder) {
        return null
      }

      return [CancelCommand(), LoadCommand(arg)]
    },
  })

  domain.effect({
    name: `${options.name}.LoadEffect`,
    impl: ({ get, fromCommand }) => {
      const ctx: AsyncModuleContext = { get }

      const handleArg = (arg: T) => {
        return new Observable<RemeshAction>((subscriber) => {
          let isUnsubscribed = false
          
          options.load(ctx, arg).then(
            (value) => {
              if (!isUnsubscribed) {
                subscriber.next(SuccessCommand(value))
                subscriber.complete()
              }
            },
            (error) => {
              if (!isUnsubscribed) {
                subscriber.next(FailedCommand(error instanceof Error ? error : new Error(`${error}`)))
                subscriber.complete()
              }
            },
          )

          return () => {
            isUnsubscribed = true
          }
        }).pipe(takeUntil(fromCommand(CancelCommand)))
      }

      if (!options.mode || options.mode === 'switch') {
        return fromCommand(LoadCommand).pipe(switchMap((arg) => handleArg(arg)))
      }

      if (options.mode === 'concat') {
        return fromCommand(LoadCommand).pipe(concatMap((arg) => handleArg(arg)))
      }

      if (options.mode === 'merge') {
        return fromCommand(LoadCommand).pipe(mergeMap((arg) => handleArg(arg)))
      }

      if (options.mode === 'exhaust') {
        return fromCommand(LoadCommand).pipe(exhaustMap((arg) => handleArg(arg)))
      }

      throw new Error(`RemeshAsyncModule: invalid mode: ${options.mode}`)
    },
  })

  return Remesh.module({
    query: {
      AsyncDataQuery,
    },
    command: {
      LoadCommand,
      CancelCommand,
      ReloadCommand,
    },
    event: {
      CanceledEvent: CanceledEvent.toSubscribeOnlyEvent(),
      LoadingEvent: LoadingEvent.toSubscribeOnlyEvent(),
      SuccessEvent: SuccessEvent.toSubscribeOnlyEvent(),
      FailedEvent: FailedEvent.toSubscribeOnlyEvent(),
    },
  })
}
