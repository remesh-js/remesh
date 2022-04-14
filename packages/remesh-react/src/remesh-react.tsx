import React, { useEffect, useRef, useContext, createContext, ReactNode, useCallback, useMemo, useReducer } from 'react'

import { flushSync } from 'react-dom'

import { useSyncExternalStore } from 'use-sync-external-store/shim'

import {
  RemeshDomainDefinition,
  RemeshQueryPayload,
  RemeshEvent,
  RemeshDomainPayload,
  RemeshStore,
  PromiseData,
  getPromiseData,
  SerializableType,
  RemeshStoreOptions,
} from 'remesh'

export type RemeshReactContext = {
  remeshStore: RemeshStore
}

export const RemeshReactContext = createContext<RemeshReactContext | null>(null)

export const useRemeshReactContext = () => {
  const context = useContext(RemeshReactContext)

  if (context === null) {
    throw new Error(`You may forgot to add <RemeshRoot />`)
  }

  return context
}

export const useRemeshStore = (): RemeshStore => {
  const context = useRemeshReactContext()
  return context.remeshStore
}

export type RemeshRootProps =
  | {
      children: ReactNode
      store?: RemeshStore
    }
  | {
      children: ReactNode
      store?: never
      options: RemeshStoreOptions
    }

export const RemeshRoot = (props: RemeshRootProps) => {
  const storeRef = useRef<RemeshStore | undefined>(props.store)

  if (!storeRef.current) {
    storeRef.current = RemeshStore('options' in props ? props.options : {})
  }

  const store = storeRef.current

  const contextValue: RemeshReactContext = useMemo(() => {
    return {
      remeshStore: store,
    }
  }, [store])

  return <RemeshReactContext.Provider value={contextValue}>{props.children}</RemeshReactContext.Provider>
}

export const useRemeshQuery = function <T extends SerializableType, U>(queryPayload: RemeshQueryPayload<T, U>): U {
  /**
   * initial domain if needed
   */
  useRemeshDomain(queryPayload.Query.owner)

  const store = useRemeshStore()

  const triggerRef = useRef<(() => void) | null>(null)

  const subscribe = useCallback((triggerUpdate: () => void) => {
    triggerRef.current = triggerUpdate
    return () => {
      triggerRef.current = null
    }
  }, [])

  const getSnapshot = useCallback(() => {
    const snapshot = store.query(queryPayload)
    return snapshot
  }, [store, queryPayload])

  const state = useSyncExternalStore(subscribe, getSnapshot)

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const queryKey = store.getKey(queryPayload)

  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [store, queryKey])

  useEffect(() => {
    if (subscriptionRef.current !== null) {
      return
    }
    subscriptionRef.current = store.subscribeQuery(queryPayload, () => {
      triggerRef.current?.()
    })
  }, [store, queryPayload])

  return state
}

const useForceUpdate = () => {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  return forceUpdate
}

export const useRemeshAsyncQuery = function <T extends SerializableType, U>(
  queryPayload: RemeshQueryPayload<T, Promise<U>>,
): PromiseData<U> {
  const store = useRemeshStore()
  const unwrappedQueryPayload = store.getUnwrappedQueryPayload(queryPayload)
  const data = useRemeshQuery(unwrappedQueryPayload)

  return data
}

export const useRemeshSuspenseQuery = function <T extends SerializableType, U>(
  queryPayload: RemeshQueryPayload<T, Promise<U>>,
): U {
  const promise = useRemeshQuery(queryPayload)
  const promiseData = getPromiseData(promise)

  if (promiseData.type === 'pending') {
    throw promise
  }

  if (promiseData.type === 'rejected') {
    throw promiseData.error
  }

  return promiseData.value
}

export const useRemeshEvent = function <T, U = T>(Event: RemeshEvent<T, U>, callback: (data: U) => unknown) {
  const store = useRemeshStore()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const subscription = store.subscribeEvent(Event, (data) => {
      callbackRef.current(data)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [Event, store])
}

export const useRemeshEmit = function () {
  const store = useRemeshStore()

  return store.emitEvent
}

export const useRemeshDomain = function <T extends RemeshDomainDefinition, Arg extends SerializableType>(
  domainPayload: RemeshDomainPayload<T, Arg>,
) {
  const store = useRemeshStore()
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const domain = store.getDomain(domainPayload)
  const domainKey = store.getKey(domainPayload)

  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [store, domainKey])

  useEffect(() => {
    if (subscriptionRef.current !== null) {
      return
    }
    subscriptionRef.current = store.subscribeDomain(domainPayload)
  }, [store, domainPayload])

  return domain
}
