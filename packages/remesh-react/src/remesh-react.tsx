import { useEffect, useRef, useContext, createContext, ReactNode, useCallback, useMemo } from 'react'

import { useSyncExternalStore } from 'use-sync-external-store/shim'

import {
  RemeshDomainDefinition,
  RemeshQueryAction,
  RemeshEvent,
  RemeshDomainAction,
  RemeshStore,
  Serializable,
  RemeshStoreOptions,
  Args,
  RemeshSubscribeOnlyEvent,
} from 'remesh'

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

  // @ts-ignore unexpected type error TS2786: 'RemeshReactContext.Provider' cannot be used as a JSX component.
  return <RemeshReactContext.Provider value={contextValue}>{props.children}</RemeshReactContext.Provider>
}

export const useRemeshQuery = function <T extends Args<Serializable>, U>(queryAction: RemeshQueryAction<T, U>): U {
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

export const useRemeshSend = function () {
  const store = useRemeshStore()

  return store.send
}

export const useRemeshDomain = function <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
  domainAction: RemeshDomainAction<T, U>,
) {
  const store = useRemeshStore()
  const domain = store.getDomain(domainAction)

  useEffect(() => {
    store.igniteDomain(domainAction)
  }, [store, domainAction])

  return domain
}
