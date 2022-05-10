import {
  RemeshDomain,
  RemeshCommand$Payload,
  RemeshCommandPayload,
  RemeshEventPayload,
  SerializableType,
  RemeshDomainDefinition,
  Args,
} from './remesh'

import type {
  RemeshStoreOptions,
  RemeshDomainStorage,
  RemeshStateStorage,
  RemeshQueryStorage,
  RemeshStore,
  RemeshStoreInspector,
} from './store'

export type RemeshDomainStorageEventData<T extends RemeshDomainDefinition, U extends Args<SerializableType>> = {
  type: 'Domain::Created' | 'Domain::Discarded' | 'Domain::Reused'
  storage: RemeshDomainStorage<T, U>
}

export type RemeshStateStorageEventData<T extends Args<SerializableType>, U> = {
  type: 'State::Created' | 'State::Updated' | 'State::Discarded' | 'State::Reused'
  storage: RemeshStateStorage<T, U>
}

export type RemeshQueryStorageEventData<T extends Args<SerializableType>, U> = {
  type: 'Query::Created' | 'Query::Updated' | 'Query::Discarded' | 'Query::Reused'
  storage: RemeshQueryStorage<T, U>
}

export type RemeshEventEmittedEventData<T extends Args, U> = {
  type: 'Event::Emitted'
  payload: RemeshEventPayload<T, U>
}

export type RemeshCommandReceivedEventData<T extends Args> = {
  type: 'Command::Received'
  payload: RemeshCommandPayload<T>
}

export type RemeshCommand$ReceivedEventData<T> = {
  type: 'Command$::Received'
  payload: RemeshCommand$Payload<T>
}

export const InspectorType = {
  DomainCreated: 'Domain::Created',
  DomainDiscarded: 'Domain::Discarded',
  DomainReused: 'Domain::Reused',
  StateCreated: 'State::Created',
  StateUpdated: 'State::Updated',
  StateDiscarded: 'State::Discarded',
  StateReused: 'State::Reused',
  QueryCreated: 'Query::Created',
  QueryUpdated: 'Query::Updated',
  QueryDiscarded: 'Query::Discarded',
  QueryReused: 'Query::Reused',
  EventEmitted: 'Event::Emitted',
  CommandReceived: 'Command::Received',
  Command$Received: 'Command$::Received',
} as const

export const RemeshInspectorDomain = RemeshDomain({
  name: 'RemeshInspector',
  impl: (domain) => {
    const RemeshDomainStorageEvent = domain.event<RemeshDomainStorageEventData<any, any>>({
      name: 'RemeshDomainStorageEvent',
    })

    const RemeshStateStorageEvent = domain.event<RemeshStateStorageEventData<any, any>>({
      name: 'RemeshStateStorageEvent',
    })

    const RemeshQueryStorageEvent = domain.event<RemeshQueryStorageEventData<any, any>>({
      name: 'RemeshQueryStorageEvent',
    })

    const RemeshEventEmittedEvent = domain.event<RemeshEventEmittedEventData<any, any>>({
      name: 'RemeshEventEmitted',
    })

    const RemeshCommandReceivedEvent = domain.event<RemeshCommandReceivedEventData<any>>({
      name: 'RemeshCommandReceived',
    })

    const RemeshCommand$ReceivedEvent = domain.event<RemeshCommand$ReceivedEventData<any>>({
      name: 'RemeshCommand$Received',
    })

    return {
      event: {
        RemeshDomainStorageEvent,
        RemeshStateStorageEvent,
        RemeshQueryStorageEvent,
        RemeshEventEmittedEvent,
        RemeshCommandReceivedEvent,
        RemeshCommand$ReceivedEvent,
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

  const inspectDomainStorage = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
    type: RemeshDomainStorageEventData<T, U>['type'],
    domainStorage: RemeshDomainStorage<T, U>,
  ) => {
    if (isInspectable(domainStorage.Domain)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        const event = inspectorDomain.event.RemeshDomainStorageEvent({
          type,
          storage: domainStorage,
        })
        inspector.emitEvent(event)
      }
    }
  }

  const inspectStateStorage = <T extends Args<SerializableType>, U>(
    type: RemeshStateStorageEventData<T, U>['type'],
    stateStorage: RemeshStateStorage<T, U>,
  ) => {
    if (isInspectable(stateStorage.State)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        const event = inspectorDomain.event.RemeshStateStorageEvent({
          type,
          storage: stateStorage,
        })
        inspector.emitEvent(event)
      }
    }
  }

  const inspectQueryStorage = <T extends Args<SerializableType>, U>(
    type: RemeshQueryStorageEventData<T, U>['type'],
    queryStorage: RemeshQueryStorage<T, U>,
  ) => {
    if (isInspectable(queryStorage.Query)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        const event = inspectorDomain.event.RemeshQueryStorageEvent({
          type,
          storage: queryStorage,
        })
        inspector.emitEvent(event)
      }
    }
  }

  const inspectEventEmitted = <T extends Args, U>(
    type: RemeshEventEmittedEventData<T, U>['type'],
    eventPayload: RemeshEventPayload<T, U>,
  ) => {
    if (isInspectable(eventPayload.Event)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        const event = inspectorDomain.event.RemeshEventEmittedEvent({
          type,
          payload: eventPayload,
        })
        inspector.emitEvent(event)
      }
    }
  }

  const inspectCommandReceived = <T extends Args>(
    type: RemeshCommandReceivedEventData<T>['type'],
    commandPayload: RemeshCommandPayload<T>,
  ) => {
    if (isInspectable(commandPayload.Command)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        const event = inspectorDomain.event.RemeshCommandReceivedEvent({
          type,
          payload: commandPayload,
        })
        inspector.emitEvent(event)
      }
    }
  }

  const inspectCommand$Received = <T>(
    type: RemeshCommand$ReceivedEventData<T>['type'],
    command$Payload: RemeshCommand$Payload<T>,
  ) => {
    if (isInspectable(command$Payload.Command$)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        const event = inspectorDomain.event.RemeshCommand$ReceivedEvent({
          type,
          payload: command$Payload,
        })
        inspector.emitEvent(event)
      }
    }
  }

  return {
    destroyInspectors,
    inspectDomainStorage,
    inspectStateStorage,
    inspectQueryStorage,
    inspectEventEmitted,
    inspectCommandReceived,
    inspectCommand$Received,
  }
}
