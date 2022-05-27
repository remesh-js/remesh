import {
  RemeshDomain,
  RemeshExtern,
  RemeshState,
  RemeshQuery,
  RemeshEvent,
  RemeshCommand,
  RemeshCommand$,
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
  query: RemeshQuery,
  command: RemeshCommand,
  command$: RemeshCommand$,
  event: RemeshEvent,
  module: RemeshModule,
}
