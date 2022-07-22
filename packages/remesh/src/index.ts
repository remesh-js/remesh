import {
  RemeshDomain,
  RemeshExtern,
  RemeshState,
  RemeshEntity,
  RemeshQuery,
  RemeshEvent,
  RemeshCommand,
  RemeshModule,
} from './remesh'

import { RemeshStore } from './store'

export * from './remesh'
export * from './store'
export * from './inspector'
export * from './type'

export const Remesh = {
  domain: RemeshDomain,
  extern: RemeshExtern,
  store: RemeshStore,
  state: RemeshState,
  entity: RemeshEntity,
  query: RemeshQuery,
  command: RemeshCommand,
  event: RemeshEvent,
  module: RemeshModule,
}
