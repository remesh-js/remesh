import { RemeshDomain, RemeshModule, RemeshExtern } from './remesh';
import { RemeshStore } from './store';

export * from './remesh';

export const Remesh = {
  domain: RemeshDomain,
  module: RemeshModule,
  extern: RemeshExtern,
  store: RemeshStore,
};
