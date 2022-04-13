import { Observable } from 'rxjs'

export type PendingPromiseData = {
  type: 'pending'
}

export type ResolvedPromiseData<T> = {
  type: 'resolved'
  value: T
}

export type RejectedPromiseData = {
  type: 'rejected'
  error: Error
}

export type PromiseData<T> = PendingPromiseData | ResolvedPromiseData<T> | RejectedPromiseData

const promiseObservableWeakMap = new WeakMap<Promise<any>, Observable<PromiseData<any>>>()

export const promiseToObservable = <T>(promise: Promise<T>): Observable<PromiseData<T>> => {
  if (promiseObservableWeakMap.has(promise)) {
    return promiseObservableWeakMap.get(promise)!
  }

  let promiseData: PromiseData<T> | null = null
  const observable: Observable<PromiseData<T>> = new Observable((subscriber) => {
    if (promiseData) {
      subscriber.next(promiseData)
      subscriber.complete()
      return
    }

    subscriber.next({ type: 'pending' })

    promise.then(
      (value) => {
        const resolvedData: ResolvedPromiseData<T> = { type: 'resolved', value }
        promiseData = resolvedData
        subscriber.next(resolvedData)
        subscriber.complete()
      },
      (error) => {
        const rejectedData: RejectedPromiseData = { type: 'rejected', error }
        promiseData = rejectedData
        subscriber.next(rejectedData)
        subscriber.complete()
      },
    )
  })

  promiseObservableWeakMap.set(promise, observable)

  return observable
}

const promiseWeakMap = new WeakMap<Promise<any>, PromiseData<any>>()

export const getPromiseData = function <T>(promise: Promise<T>): PromiseData<T> {
  if (!promiseWeakMap.has(promise)) {
    promiseWeakMap.set(promise, { type: 'pending' })

    promise.then(
      (value) => {
        promiseWeakMap.set(promise, { type: 'resolved', value })
      },
      (error) => {
        if (error instanceof Error) {
          promiseWeakMap.set(promise, { type: 'rejected', error })
        } else {
          promiseWeakMap.set(promise, { type: 'rejected', error: new Error(error) })
        }
      },
    )
  }

  return promiseWeakMap.get(promise)!
}
