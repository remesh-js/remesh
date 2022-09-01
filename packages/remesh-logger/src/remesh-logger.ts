import {
  Args,
  Remesh,
  RemeshDomainDefinition,
  RemeshDomainAction,
  RemeshInspectorDomain,
  RemeshStoreInspector,
  Serializable,
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
  entity: '#d9bdc5',
  query: '#d6c9ad',
  command: '#debdb6',
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

    const getOwnerInfo = <T extends RemeshDomainDefinition, U extends Args<Serializable>>(
      owner: RemeshDomainAction<T, U>,
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
        log(info.type, info, config.colors.state)
      })
    })

    helper.onActive('entity', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshEntityStorageEvent, (event) => {
        const Entity = event.storage.Entity
        const info = {
          type: `${event.type}::${Entity.entityName}`,
          owner: getOwnerInfo(Entity.owner),
          entityId: Entity.entityId,
          entityName: Entity.entityName,
          entityValue: event.storage.currentEntity,
          entityKey: event.storage.key,
        }

        log(info.type, info, config.colors.entity)
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
        const Command = event.action.Command
        const info = {
          type: `${event.type}::${Command.commandName}`,
          owner: getOwnerInfo(Command.owner),
          commandId: Command.commandId,
          commandName: Command.commandName,
        }

        if (event.action.arg !== undefined) {
          log(
            info.type,
            {
              ...info,
              commandArg: event.action.arg,
            },
            config.colors.command,
          )
        } else {
          log(info.type, info, config.colors.command)
        }
      })
    })

    helper.onActive('event', () => {
      store.subscribeEvent(inspectorDomain.event.RemeshEventEmittedEvent, (event) => {
        const Event = event.action.Event

        const info = {
          type: `${event.type}::${Event.eventName}`,
          owner: getOwnerInfo(Event.owner),
          eventId: Event.eventId,
          eventName: Event.eventName,
        }

        if (event.action.arg !== undefined) {
          log(
            info.type,
            {
              ...info,
              eventArg: event.action.arg,
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
