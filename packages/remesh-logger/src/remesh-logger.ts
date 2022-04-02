import { Remesh, RemeshDomainPayload, RemeshInspectorDomain, RemeshStoreInspector } from 'remesh'

import { RemeshDebugOptions, RemeshDebuggerHelper, formatNow } from 'remesh-debugger-helper'

export type RemeshLoggerOptions = RemeshDebugOptions & {
  collapsed?: boolean
}

export const RemeshLogger = (options?: RemeshLoggerOptions): RemeshStoreInspector => {
  return (storeOptions) => {
    const config = {
      collapsed: true,
      ...options,
    }

    const helper = RemeshDebuggerHelper(config)

    const log = (type: string, info: object) => {
      if (config.collapsed) {
        const parts = type.split('::')
        console.groupCollapsed(
          `%c${parts[0]}%c::%c${parts[1]}%c::%c${parts[2]}%c @ ${formatNow()}`,
          'color:#03A9F4; font-weight: bold',
          'color:#9E9E9E; font-weight: bold',
          'color:#4CAF50; font-weight: bold',
          'color:#9E9E9E; font-weight: bold',
          'color:#AA07DE; font-weight: bold',
          `color:#9E9E9E; font-weight: lighter`,
        )
      }

      console.log(info)

      if (config.collapsed) {
        console.groupEnd()
      }
    }

    const store = Remesh.store({
      ...storeOptions,
      name: `RemeshLogger(${storeOptions?.name ?? ''})`,
    })

    const inspectorDomain = store.getDomain(RemeshInspectorDomain())

    const getOwnerInfo = <T, U>(owner: RemeshDomainPayload<T, U>) => {
      const ownerInfo = {
        domainId: owner.Domain.domainId,
        domainName: owner.Domain.domainName,
      }

      if (owner.arg !== undefined) {
        return {
          ...ownerInfo,
          domainArg: owner.arg,
        }
      }

      return ownerInfo
    }

    helper.onActive('domain', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshDomainStorageEvent, (event) => {
        const Domain = event.storage.Domain
        const info = {
          type: `${event.type}::${Domain.domainName}`,
          domainId: Domain.domainId,
          domainName: Domain.domainName,
        }

        if (event.storage.arg !== undefined) {
          log(info.type, {
            ...info,
            domainArg: event.storage.arg,
          })
        } else {
          log(info.type, info)
        }
      })
    })

    helper.onActive('state', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshStateStorageEvent, (event) => {
        const State = event.storage.State
        const info = {
          type: `${event.type}::${State.stateName}`,
          owner: getOwnerInfo(State.owner),
          stateId: State.stateId,
          stateName: State.stateName,
          stateValue: event.storage.currentState,
        }

        if (event.storage.arg !== undefined) {
          log(info.type, {
            ...info,
            stateArg: event.storage.arg,
          })
        } else {
          log(info.type, info)
        }
      })
    })

    helper.onActive('query', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshQueryStorageEvent, (event) => {
        const Query = event.storage.Query
        const info = {
          type: `${event.type}::${Query.queryName}`,
          owner: getOwnerInfo(Query.owner),
          queryId: Query.queryId,
          queryName: Query.queryName,
          queryValue: event.storage.currentValue,
        }

        if (event.storage.arg !== undefined) {
          log(info.type, {
            ...info,
            queryArg: event.storage.arg,
          })
        } else {
          log(info.type, info)
        }
      })
    })

    helper.onActive('command', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshCommandReceivedEvent, (event) => {
        const Command = event.payload.Command
        const info = {
          type: `${event.type}::${Command.commandName}`,
          owner: getOwnerInfo(Command.owner),
          commandId: Command.commandId,
          commandName: Command.commandName,
        }

        if (event.payload.arg !== undefined) {
          log(info.type, {
            ...info,
            commandArg: event.payload.arg,
          })
        } else {
          log(info.type, info)
        }
      })
    })

    helper.onActive('command$', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshCommand$ReceivedEvent, (event) => {
        const Command$ = event.payload.Command$
        const info = {
          type: `${event.type}::${Command$.command$Name}`,
          owner: getOwnerInfo(Command$.owner),
          command$Id: Command$.command$Id,
          command$Name: Command$.command$Name,
        }

        if (event.payload.arg !== undefined) {
          log(info.type, {
            ...info,
            command$Arg: event.payload.arg,
          })
        } else {
          log(info.type, info)
        }
      })
    })

    helper.onActive('event', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshEventEmittedEvent, (event) => {
        const Event = event.payload.Event

        const info = {
          type: `${event.type}::${Event.eventName}`,
          owner: getOwnerInfo(Event.owner),
          eventId: Event.eventId,
          eventName: Event.eventName,
        }

        if (event.payload.arg !== undefined) {
          log(info.type, {
            ...info,
            eventArg: event.payload.arg,
          })
        } else {
          log(info.type, info)
        }
      })
    })

    return store
  }
}
