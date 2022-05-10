import { InjectionKey, Plugin, inject, Ref, ref, onMounted, onBeforeUnmount } from 'vue'

import {
  RemeshStore,
  SerializableType,
  RemeshQueryPayload,
  RemeshEvent,
  RemeshDomainDefinition,
  RemeshDomainPayload,
  Args,
} from 'remesh'

export const RemeshVueInjectKey = Symbol('RemeshVueInjectKey') as InjectionKey<RemeshStore>

export const RemeshVue = (store: RemeshStore | (() => RemeshStore)): Plugin => {
  return (app) => {
    if (typeof store === 'function') {
      app.provide(RemeshVueInjectKey, store())
    } else {
      app.provide(RemeshVueInjectKey, store)
    }
  }
}

export const useRemeshStore = () => {
  const store = inject(RemeshVueInjectKey)

  if (!store) {
    throw new Error('RemeshVue plugin not installed')
  }

  return store
}

export const useRemeshQuery = function <T extends Args<SerializableType>, U>(
  queryPayload: RemeshQueryPayload<T, U>,
): Ref<U> {
  const store = useRemeshStore()

  const queryRef = ref(store.query(queryPayload)) as Ref<U>

  let subscription: ReturnType<typeof store.subscribeQuery> | null = null

  onMounted(() => {
    subscription = store.subscribeQuery(queryPayload, () => {
      queryRef.value = store.query(queryPayload)
    })
  })

  onBeforeUnmount(() => {
    subscription?.unsubscribe()
  })

  return queryRef
}

export const useRemeshEvent = function <T extends Args, U>(Event: RemeshEvent<T, U>, callback: (data: U) => unknown) {
  const store = useRemeshStore()

  let subscription: ReturnType<typeof store.subscribeEvent> | null = null

  onMounted(() => {
    subscription = store.subscribeEvent(Event, callback)
  })

  onBeforeUnmount(() => {
    subscription?.unsubscribe()
  })
}

export const useRemeshEmit = function () {
  const store = useRemeshStore()

  return store.emitEvent
}

export const useRemeshDomain = function <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
  domainPayload: RemeshDomainPayload<T, U>,
) {
  const store = useRemeshStore()

  const domain = store.getDomain(domainPayload)

  let subscription: ReturnType<typeof store.subscribeDomain> | null = null

  onMounted(() => {
    subscription = store.subscribeDomain(domainPayload)
  })

  onBeforeUnmount(() => {
    subscription?.unsubscribe()
  })

  return domain
}
