import { RemeshDomain, RemeshCommand$Payload, RemeshCommandPayload, RemeshEventPayload } from './remesh'

import { RemeshDomainStorage, RemeshStateStorage, RemeshQueryStorage } from './store'

export type RemeshDomainStorageCreated<T, U> = {
  type: 'RemeshDomainStorageCreated'
  storage: RemeshDomainStorage<T, U>
}

export type RemeshDomainStorageDestroyed<T, U> = {
  type: 'RemeshDomainStorageDestroyed'
  storage: RemeshDomainStorage<T, U>
}

export type RemeshStateStorageCreated<T, U> = {
  type: 'RemeshStateStorageCreated'
  storage: RemeshStateStorage<T, U>
}

export type RemeshStateStorageUpdated<T, U> = {
  type: 'RemeshStateStorageUpdated'
  storage: RemeshStateStorage<T, U>
}

export type RemeshStateStorageDestroyed<T, U> = {
  type: 'RemeshStateStorageDestroyed'
  storage: RemeshStateStorage<T, U>
}

export type RemeshQueryStorageCreated<T, U> = {
  type: 'RemeshQueryStorageCreated'
  storage: RemeshQueryStorage<T, U>
}

export type RemeshQueryStorageUpdated<T, U> = {
  type: 'RemeshQueryStorageUpdated'
  storage: RemeshQueryStorage<T, U>
}

export type RemeshQueryStorageDestroyed<T, U> = {
  type: 'RemeshQueryStorageDestroyed'
  storage: RemeshQueryStorage<T, U>
}

export type RemeshEventEmitted<T, U> = {
  type: 'RemeshEventEmitted'
  payload: RemeshEventPayload<T, U>
}

export type RemeshCommandReceived<T> = {
  type: 'RemeshCommandReceived'
  payload: RemeshCommandPayload<T>
}

export type RemeshCommand$Received<T> = {
  type: 'RemeshCommand$Received'
  payload: RemeshCommand$Payload<T>
}

export const RemeshInspectorDomain = RemeshDomain({
  name: 'RemeshInspector',
  inspectable: false,
  impl: (domain) => {
    const RemeshStateStorageCreatedEvent = domain.event<RemeshStateStorageCreated<any, any>>({
      name: 'RemeshStateStorageCreated',
    })

    const RemeshStateStorageUpdatedEvent = domain.event<RemeshStateStorageUpdated<any, any>>({
      name: 'RemeshStateStorageUpdated',
    })

    const RemeshStateStorageDestroyedEvent = domain.event<RemeshStateStorageDestroyed<any, any>>({
      name: 'RemeshStateStorageDestroyed',
    })

    const RemeshQueryStorageCreatedEvent = domain.event<RemeshQueryStorageCreated<any, any>>({
      name: 'RemeshQueryStorageCreated',
    })

    const RemeshQueryStorageUpdatedEvent = domain.event<RemeshQueryStorageUpdated<any, any>>({
      name: 'RemeshQueryStorageUpdated',
    })

    const RemeshQueryStorageDestroyedEvent = domain.event<RemeshQueryStorageDestroyed<any, any>>({
      name: 'RemeshQueryStorageDestroyed',
    })

    const RemeshEventEmittedEvent = domain.event<RemeshEventEmitted<any, any>>({
      name: 'RemeshEventEmitted',
    })

    const RemeshCommandReceivedEvent = domain.event<RemeshCommandReceived<any>>({
      name: 'RemeshCommandReceived',
    })

    const RemeshCommand$ReceivedEvent = domain.event<RemeshCommand$Received<any>>({
      name: 'RemeshCommand$Received',
    })

    const RemeshDomainStorageCreatedEvent = domain.event<RemeshDomainStorageCreated<any, any>>({
      name: 'RemeshDomainStorageCreated',
    })

    const RemeshDomainStorageDestroyedEvent = domain.event<RemeshDomainStorageDestroyed<any, any>>({
      name: 'RemeshDomainStorageDestroyed',
    })

    return {
      event: {
        RemeshDomainStorageCreatedEvent,
        RemeshDomainStorageDestroyedEvent,

        RemeshStateStorageCreatedEvent,
        RemeshStateStorageUpdatedEvent,
        RemeshStateStorageDestroyedEvent,

        RemeshQueryStorageCreatedEvent,
        RemeshQueryStorageUpdatedEvent,
        RemeshQueryStorageDestroyedEvent,

        RemeshEventEmittedEvent,

        RemeshCommandReceivedEvent,
        RemeshCommand$ReceivedEvent,
      },
    }
  },
})
