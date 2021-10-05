import React, {
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
  useState,
} from "react"
import { RemeshDomainDefinition } from "."

import {
  RemeshTaskPayload,
  RemeshQuery,
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

export const useRemeshQuery = function <T>(Query: RemeshQuery<T>): T {
  const remeshStore = useRemeshStore()

  const [state, setState] = useState(() => remeshStore.query(Query))

  useEffect(() => {
    const subscription = remeshStore.subscribeQuery(Query, setState)
    return () => {
      subscription.unsubscribe()
    }
  }, [Query, remeshStore])

  return state
}

export const useRemeshEvent = function <T, U = T>(
  Event: RemeshEvent<T, U>,
  callback: (data: U) => unknown
) {
  const remeshStore = useRemeshStore()
  const callbackRef = useRef<typeof callback>(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const subscription = remeshStore.subscribeEvent(Event, (data) => {
      callbackRef.current(data)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [Event, remeshStore])
}

export const useRemeshEmit = function () {
  const remeshStore = useRemeshStore()
  return remeshStore.emit
}

export const useRemeshTask = function <T>(
  callback: () => RemeshTaskPayload<T>,
  deps: unknown[] = []
) {
  const remeshStore = useRemeshStore()

  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const subscription = remeshStore.subscribeTask(callbackRef.current())
    return () => {
      subscription.unsubscribe()
    }
  }, deps)
}

export const useRemeshDomain = function <T extends RemeshDomainDefinition>(
  Domain: RemeshDomain<T>
): T {
  const store = useRemeshStore()
  const domain = store.getDomain(Domain)

  useEffect(() => {
    const subscription = store.subscribeDomain(Domain)
    return () => {
      subscription.unsubscribe()
    }
  }, [store, Domain])

  return domain
}
