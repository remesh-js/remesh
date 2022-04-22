import { Remesh } from 'remesh'

export type Storage = {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T) => Promise<void>
  clear: (key: string) => Promise<void>
}

export const Storage = Remesh.extern<Storage>({
  name: 'Storage',
  default: {
    get: () => {
      throw new Error('Not implemented')
    },
    set: () => {
      throw new Error('Not implemented')
    },
    clear: () => {
      throw new Error('Not implemented')
    },
  },
})
