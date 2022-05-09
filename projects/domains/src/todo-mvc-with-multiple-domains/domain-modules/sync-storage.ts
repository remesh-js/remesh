import { RemeshDomainContext, RemeshCommandOutput, RemeshEvent } from 'remesh'

import { from } from 'rxjs'
import { filter, map, tap } from 'rxjs/operators'

import { Storage } from '../domain-externs/storage'

export type SyncStorageOptions<T, U = T> = {
  storageKey: string
  TriggerEvent: RemeshEvent<any, T>
  saveData: (event: T) => U
  readData: (value: U) => RemeshCommandOutput
}

const createOptions = <R>(storageKey: string, callback: <T, U>(options: SyncStorageOptions<T, U>) => R) => {
  return {
    listenTo: <T>(TriggerEvent: RemeshEvent<any, T>) => {
      return {
        saveData: <U>(saveData: (event: T) => U) => {
          return {
            readData: (readData: (value: U) => RemeshCommandOutput) => {
              return callback({
                storageKey,
                TriggerEvent,
                saveData: saveData,
                readData: readData,
              })
            },
          }
        },
        readData: (readData: (value: T) => RemeshCommandOutput) => {
          return callback({
            storageKey,
            TriggerEvent,
            saveData: (event: T) => event,
            readData: readData,
          })
        },
      }
    },
  }
}

const createSyncStorage = <T, U = T>(domain: RemeshDomainContext, options: SyncStorageOptions<T, U>) => {
  const storage = domain.getExtern(Storage)

  const ReadStorageCommand$ = domain.command$({
    name: 'ReadStorageCommand$',
    impl: () => {
      return from(storage.get<U>(options.storageKey)).pipe(
        filter((value): value is U => !!value),
        map((value) => options.readData(value)),
      )
    },
  })

  const WriteStorageCommand$ = domain.command$({
    name: 'WriteStorageCommand$',
    impl: ({ fromEvent }) => {
      return fromEvent(options.TriggerEvent).pipe(
        tap((value) => storage.set(options.storageKey, options.saveData(value))),
        map(() => null),
      )
    },
  })

  domain.ignite(() => ReadStorageCommand$())
  domain.ignite(() => WriteStorageCommand$())
}

export const syncStorage = (domain: RemeshDomainContext, storageKey: string) => {
  return createOptions(storageKey, (options) => createSyncStorage(domain, options))
}
