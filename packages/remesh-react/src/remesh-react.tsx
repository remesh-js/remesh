import React, { useEffect, useRef, useContext, createContext, ReactNode, useReducer } from 'react'

import {
  RemeshDomainDefinition,
  RemeshQueryPayload,
  RemeshEvent,
  RemeshDomainPayload,
  RemeshStore,
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
      options?: RemeshStoreOptions
      store?: undefined
    }
  | {
      children: ReactNode
      store: RemeshStore
    }

export const RemeshRoot = (props: RemeshRootProps) => {
  const taskContextRef = useRef<RemeshReactContext | null>(null)

  if (taskContextRef.current === null) {
    if (props.store) {
      taskContextRef.current = {
        remeshStore: props.store,
      }
    } else {
      taskContextRef.current = {
        remeshStore: RemeshStore({
          name: 'RemeshStore',
          ...props.options,
        }),
      }
    }
  }

  useEffect(() => {
    return () => {
      taskContextRef.current?.remeshStore.destroy()
    }
  }, [])

  return <RemeshReactContext.Provider value={taskContextRef.current}>{props.children}</RemeshReactContext.Provider>
}

const useForceUpdate = () => {
  const [, forceUpdate] = useReducer((i: number) => i + 1, 0)
  return forceUpdate
}

export const useRemeshQuery = function <T, U>(queryPayload: RemeshQueryPayload<T, U>): U {
  const store = useRemeshStore()

  const forceUpdate = useForceUpdate()

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const queryKey = store.getKey(queryPayload)

  const state = store.query(queryPayload)

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
    subscriptionRef.current = store.subscribeQuery(queryPayload, forceUpdate)
  }, [store, queryPayload])

  return state
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

export const useRemeshDomain = function <T extends RemeshDomainDefinition, Arg>(
  domainPayload: RemeshDomainPayload<T, Arg>,
) {
  const store = useRemeshStore()
  const domain = store.getDomain(domainPayload)

  useEffect(() => {
    const subscription = store.subscribeDomain(domainPayload)
    return () => {
      subscription.unsubscribe()
    }
  }, [store, domainPayload])

  return domain
}
