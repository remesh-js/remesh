import {
  RemeshDomain,
  RemeshCommand$Action,
  RemeshCommandAction,
  RemeshEventAction,
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
  action: RemeshEventAction<T, U>
}

export type RemeshCommandReceivedEventData<T extends Args> = {
  type: 'Command::Received'
  action: RemeshCommandAction<T>
}

export type RemeshCommand$ReceivedEventData<T> = {
  type: 'Command$::Received'
  action: RemeshCommand$Action<T>
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
  name: 'RemeshInspectorDomain',
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
      name: 'RemeshEventEmittedEvent',
    })

    const RemeshCommandReceivedEvent = domain.event<RemeshCommandReceivedEventData<any>>({
      name: 'RemeshCommandReceivedEvent',
    })

    const RemeshCommand$ReceivedEvent = domain.event<RemeshCommand$ReceivedEventData<any>>({
      name: 'RemeshCommand$ReceivedEvent',
    })

    const InspectQueryStorageCommand = domain.command({
      name: 'InspectQueryStorageCommand',
      impl: (_, data: RemeshQueryStorageEventData<any, any>) => {
        return RemeshQueryStorageEvent(data)
      },
    })

    const InspectStateStorageCommand = domain.command({
      name: 'InspectStateStorageCommand',
      impl: (_, data: RemeshStateStorageEventData<any, any>) => {
        return RemeshStateStorageEvent(data)
      },
    })

    const InspectDomainStorageCommand = domain.command({
      name: 'InspectDomainStorageCommand',
      impl: (_, data: RemeshDomainStorageEventData<any, any>) => {
        return RemeshDomainStorageEvent(data)
      },
    })

    const InspectEventEmittedCommand = domain.command({
      name: 'InspectEventEmittedCommand',
      impl: (_, data: RemeshEventEmittedEventData<any, any>) => {
        return RemeshEventEmittedEvent(data)
      },
    })

    const InspectCommandReceivedCommand = domain.command({
      name: 'InspectCommandReceivedCommand',
      impl: (_, data: RemeshCommandReceivedEventData<any>) => {
        return RemeshCommandReceivedEvent(data)
      },
    })

    const InspectCommand$ReceivedCommand = domain.command({
      name: 'InspectCommand$ReceivedCommand',
      impl: (_, data: RemeshCommand$ReceivedEventData<any>) => {
        return RemeshCommand$ReceivedEvent(data)
      },
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
      command: {
        InspectQueryStorageCommand,
        InspectStateStorageCommand,
        InspectDomainStorageCommand,
        InspectEventEmittedCommand,
        InspectCommandReceivedCommand,
        InspectCommand$ReceivedCommand,
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
        inspectorDomain.command.InspectDomainStorageCommand({
          type,
          storage: domainStorage,
        })
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
        inspectorDomain.command.InspectStateStorageCommand({
          type,
          storage: stateStorage,
        })
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
        inspectorDomain.command.InspectQueryStorageCommand({
          type,
          storage: queryStorage,
        })
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
        inspectorDomain.command.InspectEventEmittedCommand({
          type,
          action: eventAction,
        })
      }
    }
  }

  const inspectCommandReceived = <T extends Args>(
    type: RemeshCommandReceivedEventData<T>['type'],
    commandAction: RemeshCommandAction<T>,
  ) => {
    if (isInspectable(commandAction.Command)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        inspectorDomain.command.InspectCommandReceivedCommand({
          type,
          action: commandAction,
        })
      }
    }
  }

  const inspectCommand$Received = <T>(
    type: RemeshCommand$ReceivedEventData<T>['type'],
    command$Action: RemeshCommand$Action<T>,
  ) => {
    if (isInspectable(command$Action.Command$)) {
      for (const inspector of getInspectors()) {
        const inspectorDomain = inspector.getDomain(RemeshInspectorDomain())
        inspectorDomain.command.InspectCommand$ReceivedCommand({
          type,
          action: command$Action,
        })
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
