import { Remesh } from 'remesh'

export type Storage = {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T) => Promise<void>
  clear: (key: string) => Promise<void>
}

export const Storage = Remesh.extern<Storage | null>({
  name: 'StorageExtern',
  default: null,
})
