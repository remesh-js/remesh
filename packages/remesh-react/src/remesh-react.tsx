import React, { useEffect, useRef, useContext, createContext, ReactNode, useCallback, useMemo } from 'react'

import { useSyncExternalStore } from 'use-sync-external-store/shim'

import {
  RemeshDomainDefinition,
  RemeshQueryAction,
  RemeshEvent,
  RemeshDomainAction,
  RemeshStore,
  SerializableType,
  RemeshStoreOptions,
  Args,
  RemeshSubscribeOnlyEvent,
} from 'remesh'

import { AsyncData } from 'remesh/modules/async'

export type RemeshReactContext = {
  remeshStore: RemeshStore
}

export const RemeshReactContext = createContext<RemeshReactContext | null>(null)

if (process.env.NODE_ENV !== 'production') {
  RemeshReactContext.displayName = 'Remesh'
}

export const useRemeshReactContext = () => {
  const context = useContext(RemeshReactContext)

  if (context === null) {
    throw new Error(`You may forget to add <RemeshRoot />`)
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

export const useRemeshQuery = function <T extends Args<SerializableType>, U>(queryAction: RemeshQueryAction<T, U>): U {
  /**
   * initial domain if needed
   */
  useRemeshDomain(queryAction.Query.owner)

  const store = useRemeshStore()

  const triggerRef = useRef<(() => void) | null>(null)

  const subscribe = useCallback((triggerUpdate: () => void) => {
    triggerRef.current = triggerUpdate
    return () => {
      triggerRef.current = null
    }
  }, [])

  const getSnapshot = useCallback(() => {
    const snapshot = store.query(queryAction)
    return snapshot
  }, [store, queryAction])

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const queryKey = store.getKey(queryAction)

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
    subscriptionRef.current = store.subscribeQuery(queryAction, () => {
      triggerRef.current?.()
    })
  }, [store, queryAction])

  return state
}

export const useRemeshSuspense = function <T extends Args<SerializableType>, U>(
  queryAction: RemeshQueryAction<T, AsyncData<U>>,
) {
  const state = useRemeshQuery(queryAction)

  if (state.type === 'loading') {
    throw state.promise
  }

  if (state.type === 'failed') {
    throw state.error
  }

  if (state.type === 'success') {
    return state.value
  }
}

export const useRemeshEvent = function <T extends Args, U>(
  Event: RemeshEvent<T, U> | RemeshSubscribeOnlyEvent<T, U>,
  callback: (data: U) => unknown,
) {
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

export const useRemeshDomain = function <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
  domainAction: RemeshDomainAction<T, U>,
) {
  const store = useRemeshStore()
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const domain = store.getDomain(domainAction)
  const domainKey = store.getKey(domainAction)

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
    subscriptionRef.current = store.subscribeDomain(domainAction)
  }, [store, domainAction])

  return domain
}
