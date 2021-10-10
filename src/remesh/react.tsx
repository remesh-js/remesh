import React, {
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
  useState,
  useMemo,
} from "react"

import {
  RemeshDomainDefinition,
  RemeshDomainExtract,
  RemeshQueryPayload,
  RemeshTaskPayload,
  RemeshEvent,
  RemeshStore,
  RemeshStoreOptions,
  RemeshDomain,
} from "./remesh"

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

export const useRemeshStore = () => {
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
          name: "RemeshStore",
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

  return (
    <RemeshReactContext.Provider value={taskContextRef.current}>
      {props.children}
    </RemeshReactContext.Provider>
  )
}

export const useRemeshQuery = function <T, U>(
  queryPayload: RemeshQueryPayload<T, U>
): T {
  const store = useRemeshStore()

  const queryRef = useMemo(() => {
    return store.createQueryRef(queryPayload)
  }, [queryPayload, store])

  const [state, setState] = useState(queryRef.get())

  useEffect(() => {
    const subscription = store.subscribeQuery(queryPayload, setState)
    return () => {
      subscription.unsubscribe()
      queryRef.drop()
    }
  }, [queryPayload, queryRef, store])

  return state
}

export const useRemeshEvent = function <T, U = T>(
  Event: RemeshEvent<T, U>,
  callback: (data: U) => unknown
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
  return store.emit
}

export const useRemeshTask = function <T>(
  callback: () => RemeshTaskPayload<T>,
  deps: unknown[] = []
) {
  const store = useRemeshStore()

  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const subscription = store.subscribeTask(callbackRef.current())
    return () => {
      subscription.unsubscribe()
    }
  }, deps)
}

export const useRemeshDomain = function <T extends RemeshDomainDefinition>(
  Domain: RemeshDomain<T>
): RemeshDomainExtract<T> {
  const store = useRemeshStore()

  const domainRef = useMemo(() => {
    return store.createDomainRef(Domain)
  }, [store, Domain])

  const domain = domainRef.get()

  useEffect(() => {
    const subscription = store.subscribeDomain(Domain)
    return () => {
      domainRef.drop()
      subscription.unsubscribe()
    }
  }, [store, Domain, domainRef])

  return domain
}
