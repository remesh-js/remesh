import {
  Args,
  RemeshCommandAction,
  RemeshDomain,
  RemeshDomainDefinition,
  RemeshEventAction,
  Serializable,
  SerializableObject,
} from './remesh'

import type {
  RemeshDomainStorage,
  RemeshEntityStorage,
  RemeshQueryStorage,
  RemeshStateStorage,
  RemeshStore,
  RemeshStoreInspector,
  RemeshStoreOptions,
} from './store'

export type RemeshDomainStorageEventData<T extends RemeshDomainDefinition, U extends Args<Serializable>> = {
  type: 'Domain::Created' | 'Domain::Discarded' | 'Domain::Reused'
  storage: RemeshDomainStorage<T, U>
}

export type RemeshStateStorageEventData<T> = {
  type: 'State::Created' | 'State::Updated' | 'State::Discarded' | 'State::Reused'
  storage: RemeshStateStorage<T>
}

export type RemeshQueryStorageEventData<T extends Args<Serializable>, U> = {
  type: 'Query::Created' | 'Query::Updated' | 'Query::Discarded' | 'Query::Reused'
  storage: RemeshQueryStorage<T, U>
}

export type RemeshEventEmittedEventData<T extends Args, U> = {
  type: 'Event::Emitted'
  action: RemeshEventAction<T, U>
}

export type RemeshCommandReceivedEventData<T extends Args> = {
  type: 'Command::Received'
  action: RemeshCommandAction<T>
}

export type RemeshEntityStorageEventData<T extends SerializableObject> = {
  type: 'Entity::Created' | 'Entity::Updated' | 'Entity::Discarded' | 'Entity::Reused'
  storage: RemeshEntityStorage<T>
}

export const InspectorType = {
  DomainCreated: 'Domain::Created',
  DomainDiscarded: 'Domain::Discarded',
  DomainReused: 'Domain::Reused',
  StateCreated: 'State::Created',
  StateUpdated: 'State::Updated',
  StateDiscarded: 'State::Discarded',
  StateReused: 'State::Reused',
  EntityCreated: 'Entity::Created',
  EntityUpdated: 'Entity::Updated',
  EntityDiscarded: 'Entity::Discarded',
  EntityReused: 'Entity::Reused',
  QueryCreated: 'Query::Created',
  QueryUpdated: 'Query::Updated',
  QueryDiscarded: 'Query::Discarded',
  QueryReused: 'Query::Reused',
  EventEmitted: 'Event::Emitted',
  CommandReceived: 'Command::Received',
} as const

export const RemeshInspectorDomain = RemeshDomain({
  name: 'RemeshInspectorDomain',
  impl: (domain) => {
    const RemeshDomainStorageEvent = domain.event<RemeshDomainStorageEventData<any, any>>({
      name: 'RemeshDomainStorageEvent',
    })

    const RemeshStateStorageEvent = domain.event<RemeshStateStorageEventData<any>>({
      name: 'RemeshStateStorageEvent',
    })

    const RemeshQueryStorageEvent = domain.event<RemeshQueryStorageEventData<any, any>>({
      name: 'RemeshQueryStorageEvent',
    })

    const RemeshEventEmittedEvent = domain.event<RemeshEventEmittedEventData<any, any>>({
      name: 'RemeshEventEmittedEvent',
    })

    const RemeshCommandReceivedEvent = domain.event<RemeshCommandReceivedEventData<any>>({
      name: 'RemeshCommandReceivedEvent',
    })

    const RemeshEntityStorageEvent = domain.event<RemeshEntityStorageEventData<any>>({
      name: 'RemeshEntityStorageEvent',
    })

    return {
      event: {
        RemeshDomainStorageEvent,
        RemeshStateStorageEvent,
        RemeshQueryStorageEvent,
        RemeshEventEmittedEvent,
        RemeshCommandReceivedEvent,
        RemeshEntityStorageEvent,
      },
    }
  },
})

export type InspectInput = {
  inspectable: boolean
  owner?: {
    Domain: {
      inspectable: boolean
    }
  }
}

export const isInspectable = (input: InspectInput): boolean => {
  if (input.owner) {
    return input.owner.Domain.inspectable && input.inspectable
  }
  return input.inspectable
}

const initInspectors = (options: RemeshStoreOptions) => {
  return (options.inspectors ?? [])
    .filter((inspector): inspector is RemeshStoreInspector => !!inspector)
    .map((inspector) => {
      const { inspectors, ...rest } = options
      return inspector(rest)
    })
}

export const createInspectorManager = (options: RemeshStoreOptions) => {
  let inspectors: RemeshStore[] | null = null

  const getInspectors = (): RemeshStore[] => {
    if (!inspectors) {
      inspectors = initInspectors(options)
    }

    return inspectors
  }

  const destroyInspectors = () => {
    if (inspectors) {
      for (const inspector of inspectors) {
        inspector.discard()
      }

      inspectors = null
    }
  }

  const inspectDomainStorage = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
    type: RemeshDomainStorageEventData<T, U>['type'],
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (isInspectable(domainStorage.Domain)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())

        inspector.send(
          inspectorDomain.event.RemeshDomainStorageEvent({
            type,
            storage: domainStorage,
          }),
        )
      }
    }
  }

  const inspectStateStorage = <T>(
    type: RemeshStateStorageEventData<T>['type'],
    stateStorage: RemeshStateStorage<T>,
  ) => {
    if (isInspectable(stateStorage.State)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())

        inspector.send(
          inspectorDomain.event.RemeshStateStorageEvent({
            type,
            storage: stateStorage,
          }),
        )
      }
    }
  }

  const inspectQueryStorage = <T extends Args<Serializable>, U>(
    type: RemeshQueryStorageEventData<T, U>['type'],
    queryStorage: RemeshQueryStorage<T, U>,
  ) => {
    if (isInspectable(queryStorage.Query)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())

        inspector.send(
          inspectorDomain.event.RemeshQueryStorageEvent({
            type,
            storage: queryStorage,
          }),
        )
      }
    }
  }

  const inspectEventEmitted = <T extends Args, U>(
    type: RemeshEventEmittedEventData<T, U>['type'],
    eventAction: RemeshEventAction<T, U>,
  ) => {
    if (isInspectable(eventAction.Event)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())

        inspector.send(
          inspectorDomain.event.RemeshEventEmittedEvent({
            type,
            action: eventAction,
          }),
        )
      }
    }
  }

  const inspectCommandReceived = <T extends Args, U>(
    type: RemeshCommandReceivedEventData<T>['type'],
    commandAction: RemeshCommandAction<T>,
  ) => {
    if (isInspectable(commandAction.Command)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())

        inspector.send(
          inspectorDomain.event.RemeshCommandReceivedEvent({
            type,
            action: commandAction,
          }),
        )
      }
    }
  }

  const inspectEntityStorage = <T extends SerializableObject>(
    type: RemeshEntityStorageEventData<T>['type'],
    entityStorage: RemeshEntityStorage<T>,
  ) => {
    if (isInspectable(entityStorage.Entity)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())

        inspector.send(
          inspectorDomain.event.RemeshEntityStorageEvent({
            type,
            storage: entityStorage,
          }),
        )
      }
    }
  }

  return {
    destroyInspectors,
    inspectDomainStorage,
    inspectStateStorage,
    inspectQueryStorage,
    inspectEntityStorage,
    inspectEventEmitted,
    inspectCommandReceived,
  }
}
