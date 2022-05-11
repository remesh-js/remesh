import {
  Args,
  Remesh,
  RemeshDomainDefinition,
  RemeshDomainPayload,
  RemeshInspectorDomain,
  RemeshStoreInspector,
  SerializableType,
} from 'remesh'

import { RemeshDebugOptions, RemeshDebuggerHelper, formatNow } from 'remesh-debugger-helper'

export type RemeshLoggerOptions = RemeshDebugOptions & {
  collapsed?: boolean
  colors?: typeof colors
}

const colors = {
  domain: '#bfb1cc',
  event: '#aec6d4',
  state: '#adc7af',
  query: '#d6c9ad',
  command: '#debdb6',
  command$: '#d9bdc5',
}

export const RemeshLogger = (options?: RemeshLoggerOptions): RemeshStoreInspector => {
  return (storeOptions) => {
    const config = {
      collapsed: true,
      colors,
      ...options,
    }

    const helper = RemeshDebuggerHelper(config)

    const log = (type: string, info: object, color: string) => {
      if (config.collapsed) {
        console.groupCollapsed(
          `%c${type}%c @ ${formatNow()}`,
          `background-color:${color}; color: #000; font-weight: bold`,
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

    const getOwnerInfo = <T extends RemeshDomainDefinition, U extends Args<SerializableType>>(
      owner: RemeshDomainPayload<T, U>,
    ) => {
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
          log(
            info.type,
            {
              ...info,
              domainArg: event.storage.arg,
            },
            config.colors.domain,
          )
        } else {
          log(info.type, info, config.colors.domain)
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
          log(
            info.type,
            {
              ...info,
              stateArg: event.storage.arg,
            },
            config.colors.state,
          )
        } else {
          log(info.type, info, config.colors.state)
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
          log(
            info.type,
            {
              ...info,
              queryArg: event.storage.arg,
            },
            config.colors.query,
          )
        } else {
          log(info.type, info, config.colors.query)
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
          log(
            info.type,
            {
              ...info,
              commandArg: event.payload.arg,
            },
            config.colors.command,
          )
        } else {
          log(info.type, info, config.colors.command)
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
          log(
            info.type,
            {
              ...info,
              command$Arg: event.payload.arg,
            },
            config.colors.command$,
          )
        } else {
          log(info.type, info, config.colors.command$)
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
          log(
            info.type,
            {
              ...info,
              eventArg: event.payload.arg,
            },
            config.colors.event,
          )
        } else {
          log(info.type, info, config.colors.event)
        }
      })
    })

    return store
  }
}
