import { Remesh, RemeshDomainPayload, RemeshInspectorDomain, RemeshStoreOptions } from 'remesh'

import type { Config as _Config } from '@redux-devtools/extension'
import type { Action } from 'redux'

const getReduxDevtools = () => {
  if (typeof window !== 'undefined') {
    return window.__REDUX_DEVTOOLS_EXTENSION__
  }
}

export type RemeshReduxDevtoolsOptions = Omit<RemeshStoreOptions, 'name'> & {
  name?: string
}

export const RemeshReduxDevtools = (options?: RemeshReduxDevtoolsOptions) => {
  const reduxDevtools = getReduxDevtools()

  if (!reduxDevtools) {
    return
  }

  const devtools = reduxDevtools.connect({
    name: options?.name,
    features: {
      pause: false, // start/pause recording of dispatched actions
      lock: false, // lock/unlock dispatching actions and side effects
      persist: false, // persist states on page reloading
      export: true, // export history of actions in a file
      import: false, // import history of actions from a file
      jump: false, // jump back and forth (time travelling)
      skip: false, // skip (cancel) actions
      reorder: false, // drag and drop actions in the history list
      dispatch: false, // dispatch custom actions or action creators
      test: false, // generate tests for the selected actions
    },
  })

  const send = (action: Action<unknown>) => {
    devtools.send(action, null)
  }

  const store = Remesh.store({
    name: `RemeshInspector(${options?.name ?? ''})`,
  })

  const inspectorDomain = store.getDomain(RemeshInspectorDomain())

  const getOwnerInfo = <T, U>(owner: RemeshDomainPayload<T, U>) => {
    return {
      domainId: owner.Domain.domainId,
      domainName: owner.Domain.domainName,
      domainArg: owner.arg,
    }
  }

  store.subscribeEvent(inspectorDomain.event.RemeshDomainStorageCreatedEvent, (event) => {
    const Domain = event.storage.Domain
    send({
      type: `Domain::Created::${Domain.domainName}`,
      domainId: Domain.domainId,
      domainName: Domain.domainName,
      domainArg: event.storage.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshDomainStorageDestroyedEvent, (event) => {
    const Domain = event.storage.Domain
    send({
      type: `Domain::Destroyed::${Domain.domainName}`,
      domainId: Domain.domainId,
      domainName: Domain.domainName,
      domainArg: event.storage.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshStateStorageCreatedEvent, (event) => {
    const State = event.storage.State
    send({
      type: `State::Created::${State.stateName}`,
      owner: getOwnerInfo(State.owner),
      stateId: State.stateId,
      stateName: State.stateName,
      stateArg: event.storage.arg,
      stateValue: event.storage.currentState,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshStateStorageUpdatedEvent, (event) => {
    const State = event.storage.State
    send({
      type: `State::Updated::${State.stateName}`,
      owner: getOwnerInfo(State.owner),
      stateId: State.stateId,
      stateName: State.stateName,
      stateArg: event.storage.arg,
      stateValue: event.storage.currentState,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshStateStorageDestroyedEvent, (event) => {
    const State = event.storage.State
    send({
      type: `State::Destroyed::${State.stateName}`,
      owner: getOwnerInfo(State.owner),
      stateId: State.stateId,
      stateName: State.stateName,
      stateArg: event.storage.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshQueryStorageCreatedEvent, (event) => {
    const Query = event.storage.Query
    send({
      type: `Query::Created::${Query.queryName}`,
      owner: getOwnerInfo(Query.owner),
      queryId: Query.queryId,
      queryName: Query.queryName,
      queryArg: event.storage.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshQueryStorageUpdatedEvent, (event) => {
    const Query = event.storage.Query
    send({
      type: `Query::Updated::${Query.queryName}`,
      owner: getOwnerInfo(Query.owner),
      queryId: Query.queryId,
      queryName: Query.queryName,
      queryArg: event.storage.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshQueryStorageDestroyedEvent, (event) => {
    const Query = event.storage.Query
    send({
      type: `Query::Destroyed::${Query.queryName}`,
      owner: getOwnerInfo(Query.owner),
      queryId: Query.queryId,
      queryName: Query.queryName,
      queryArg: event.storage.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshCommandReceivedEvent, (event) => {
    const Command = event.payload.Command
    send({
      type: `Command::Received::${Command.commandName}`,
      owner: getOwnerInfo(Command.owner),
      commandId: Command.commandId,
      commandName: Command.commandName,
      commandArg: event.payload.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshCommand$ReceivedEvent, (event) => {
    const Command$ = event.payload.Command$
    send({
      type: `Command::Received::${Command$.command$Name}`,
      owner: getOwnerInfo(Command$.owner),
      command$Id: Command$.command$Id,
      command$Name: Command$.command$Name,
      command$Arg: event.payload.arg,
    })
  })

  store.subscribeEvent(inspectorDomain.event.RemeshEventEmittedEvent, (event) => {
    const Event = event.payload.Event

    send({
      type: `Event::Emitted::${Event.eventName}`,
      owner: getOwnerInfo(Event.owner),
      eventId: Event.eventId,
      eventName: Event.eventName,
      eventArg: event.payload.arg,
    })
  })

  return store
}
