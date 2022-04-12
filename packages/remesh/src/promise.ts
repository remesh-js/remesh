export type PendingPromise = {
  type: 'pending'
}

export type ResolvedPromise<T> = {
  type: 'resolved'
  value: T
}

export type RejectedPromise = {
  type: 'rejected'
  error: Error
}

export type PromiseData<T> = PendingPromise | ResolvedPromise<T> | RejectedPromise

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
