import { RemeshDomainContext, RemeshCommandContext, RemeshEvent } from 'remesh'

import { from, merge } from 'rxjs'
import { filter, map, tap } from 'rxjs/operators'

import { Storage } from '../domain-externs/storage'

export type SyncStorageOptions<T, U = T> = {
  storageKey: string
  TriggerEvent: RemeshEvent<any, T>
  get: (event: T) => U
  set: (ctx: RemeshCommandContext, value: U) => unknown
}

const createOptions = <R>(storageKey: string, callback: <T, U>(options: SyncStorageOptions<T, U>) => R) => {
  return {
    listenTo: <T>(TriggerEvent: RemeshEvent<any, T>) => {
      return {
        get: <U>(get: (event: T) => U) => {
          return {
            set: (set: SyncStorageOptions<T, U>['set']) => {
              return callback({
                storageKey,
                TriggerEvent,
                get: get,
                set: set,
              })
            },
          }
        },
        set: (set: SyncStorageOptions<T, T>['set']) => {
          return callback({
            storageKey,
            TriggerEvent,
            get: (event: T) => event,
            set: set,
          })
        },
      }
    },
  }
}

const createSyncStorage = <T, U = T>(domain: RemeshDomainContext, options: SyncStorageOptions<T, U>) => {
  const storage = domain.getExtern(Storage)

  const ReadStorageCommand = domain.command({
    name: 'ReadStorageCommand',
    impl: async (ctx) => {
      const value = await storage.get<U>(options.storageKey)

      if (value) {
        options.set(ctx, value)
      }
    },
  })

  const WriteStorageCommand = domain.command({
    name: 'WriteStorageCommand',
    impl: ({ fromEvent }) => {
      return fromEvent(options.TriggerEvent).pipe(
        tap((value) => {
          storage.set(options.storageKey, options.get(value))
        }),
      )
    },
  })

  domain.ignite(({ send }) => {
    return merge(send(ReadStorageCommand()), send(WriteStorageCommand()))
  })
}

export const syncStorage = (domain: RemeshDomainContext, storageKey: string) => {
  return createOptions(storageKey, (options) => createSyncStorage(domain, options))
}
