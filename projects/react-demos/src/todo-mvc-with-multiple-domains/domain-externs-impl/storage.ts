import localforage from 'localforage'
import { Storage } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domain-externs/storage'

export const StorageImpl = Storage.impl({
  get: (key) => {
    return localforage.getItem(key)
  },
  set: async (key, value) => {
    await localforage.setItem(key, value)
  },
  clear: (key) => {
    return localforage.removeItem(key)
  },
})
