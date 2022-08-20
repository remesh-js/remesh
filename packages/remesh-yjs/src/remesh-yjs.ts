import {
  Remesh,
  RemeshDomainContext,
  RemeshCommandContext,
  SerializableObject,
  SerializableArray,
  RemeshAction,
  RemeshQueryContext,
} from 'remesh'

import { ListModule } from 'remesh/modules/list'

import { Observable, merge } from 'rxjs'

import { map, tap } from 'rxjs/operators'

import * as Y from 'yjs'

export type SerializableType = SerializableObject | SerializableArray

export const origin = 'from-remesh-yjs'

const fromYjs = (yjsValue: Y.AbstractType<any>) => {
  return new Observable<SerializableType>((subscriber) => {
    const handler = (_yevents: Y.YEvent<Y.AbstractType<unknown>>[], transaction: Y.Transaction) => {
      if (transaction.origin !== origin) {
        const value = yjsValue.toJSON()
        subscriber.next(value)
      }
    }

    const listen = () => {
      yjsValue.observeDeep(handler)
    }

    const unlisten = () => {
      yjsValue.unobserveDeep(handler)
    }

    listen()

    return () => {
      unlisten()
    }
  })
}

export type RemeshYjsExtern = {
  doc: Y.Doc
}

export const RemeshYjsExtern = Remesh.extern<RemeshYjsExtern | null>({
  default: null,
})

export type RemeshYjOptions<T extends SerializableType> = {
  key: string
  inspectable?: boolean
  dataType: 'object' | 'array'
  onSend: (context: RemeshQueryContext) => T
  onReceive: (context: RemeshCommandContext, value: T) => RemeshAction
}

export const RemeshYjs = <T extends SerializableType>(domain: RemeshDomainContext, options: RemeshYjOptions<T>) => {
  const yjsExtern = domain.getExtern(RemeshYjsExtern)

  if (yjsExtern === null) {
    return null
  }

  function assertDataType(value: unknown): asserts value is T {
    if (Array.isArray(value) && options.dataType === 'array') {
      return
    }

    if (value !== null && typeof value === 'object' && options.dataType === 'object') {
      return
    }

    throw new Error(`Expected value to be of type ${options.dataType}, got ${value}`)
  }

  const getYjsValue = (doc: Y.Doc) => {
    return doc.get(options.key, options.dataType === 'object' ? Y.Map : Y.Array)
  }

  const ReceivedEvent = Remesh.event<T>({
    name: 'ReceivedEvent',
  })

  const SendEvent = Remesh.event<T>({
    name: 'SendEvent',
  })

  const DataForSyncQuery = domain.query({
    name: 'DataForSyncQuery',
    impl: options.onSend,
  })

  const SyncDataCommand = domain.command({
    name: 'SyncDataCommand',
    impl: (ctx, data: T) => {
      return [options.onReceive(ctx, data), ReceivedEvent(data)]
    },
  })

  domain.effect({
    name: `YjsEffect`,
    impl: ({ get, fromQuery }) => {
      const { doc } = yjsExtern

      const yjsValue = getYjsValue(doc)

      const send$ = fromQuery(DataForSyncQuery()).pipe(
        map((value) => {
          assertDataType(value)
          const currentJson = yjsValue.toJSON()
          const diffResult = diff(currentJson, value)

          if (diffResult === null) {
            return null
          }

          Y.transact(
            doc,
            () => {
              patchYjs(yjsValue, diffResult)
            },
            origin,
          )

          return SendEvent(value)
        }),
      )

      const receive$ = fromYjs(yjsValue).pipe(
        map((next) => {
          assertDataType(next)

          const current = get(DataForSyncQuery())

          if (current === null) {
            return SyncDataCommand(next)
          }

          const diffResult = diff(current, next)

          if (diffResult === null) {
            return null
          }

          const value = patch(current, diffResult) as T

          return SyncDataCommand(value)
        }),
      )

      return merge(send$, receive$)
    },
  })
}

export type ObjectDiffResult = {
  type: 'object'
  key?: string | number
  addedResults: AddedDiffResult[]
  deletedResults: DeletedDiffResult[]
  updatedResults: UpdatedDiffResult[]
}

export type ArrayDiffResult = {
  type: 'array'
  key?: string | number
  addedResults: AddedDiffResult[]
  deletedResults: DeletedDiffResult[]
  updatedResults: UpdatedDiffResult[]
}

export type AddedDiffResult = {
  type: 'added'
  key?: string | number
  value: unknown
}

export type DeletedDiffResult = {
  type: 'deleted'
  key?: string | number
}

export type ChangedDiffResult = {
  type: 'changed'
  key?: string | number
  value: unknown
}

export type UpdatedDiffResult = ChangedDiffResult | ArrayDiffResult | ObjectDiffResult

export type DiffResult =
  | ObjectDiffResult
  | ArrayDiffResult
  | null
  | AddedDiffResult
  | DeletedDiffResult
  | ChangedDiffResult

export const isUpdatedDiffResult = (input: DiffResult): input is UpdatedDiffResult => {
  return !!input && (input.type === 'object' || input.type === 'array' || input.type === 'changed')
}

const hasOwn = (object: object, key: string) => {
  return Object.prototype.hasOwnProperty.call(object, key)
}

export const diffObject = (oldObject: object, newObject: object, key?: string | number): ObjectDiffResult | null => {
  const addedResults: AddedDiffResult[] = []
  const deletedResults: DeletedDiffResult[] = []
  const updatedResults: UpdatedDiffResult[] = []

  for (const [key, value] of Object.entries(newObject)) {
    if (!hasOwn(oldObject, key)) {
      addedResults.push({
        type: 'added',
        key,
        value,
      })
    } else if (oldObject[key] !== value) {
      const diffResult = diff(oldObject[key], value, key)

      if (isUpdatedDiffResult(diffResult)) {
        updatedResults.push(diffResult)
      }
    }
  }

  for (const key of Object.keys(oldObject)) {
    if (!hasOwn(newObject, key)) {
      deletedResults.push({
        type: 'deleted',
        key,
      })
    }
  }

  if (addedResults.length === 0 && deletedResults.length === 0 && updatedResults.length === 0) {
    return null
  }

  return {
    type: 'object',
    key,
    addedResults,
    deletedResults,
    updatedResults,
  }
}

export const diffArray = (oldArray: unknown[], newArray: unknown[], key?: string | number): ArrayDiffResult | null => {
  const addedResults: AddedDiffResult[] = []
  const deletedResults: DeletedDiffResult[] = []
  const updatedResults: UpdatedDiffResult[] = []

  for (let i = 0; i < newArray.length; i++) {
    if (i >= oldArray.length) {
      addedResults.push({
        type: 'added',
        key: i,
        value: newArray[i],
      })
    } else if (oldArray[i] !== newArray[i]) {
      const diffResult = diff(oldArray[i], newArray[i], i)

      if (isUpdatedDiffResult(diffResult)) {
        updatedResults.push(diffResult)
      }
    }
  }

  for (let i = newArray.length; i < oldArray.length; i++) {
    deletedResults.push({
      type: 'deleted',
      key: i,
    })
  }

  if (addedResults.length === 0 && deletedResults.length === 0 && updatedResults.length === 0) {
    return null
  }

  return {
    type: 'array',
    key,
    addedResults,
    deletedResults,
    updatedResults,
  }
}

const diff = (oldValue: unknown, newValue: unknown, key?: string | number): UpdatedDiffResult | null => {
  if (oldValue === newValue) {
    return null
  }

  if (oldValue === null || newValue === null) {
    return {
      type: 'changed',
      key,
      value: newValue,
    }
  }

  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return diffArray(oldValue, newValue, key)
  }

  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    return diffObject(oldValue, newValue, key)
  }

  return {
    type: 'changed',
    key,
    value: newValue,
  }
}

const patchObject = (oldValue: object, diffResult: ObjectDiffResult): object => {
  const newValue = { ...oldValue }

  for (const addedResult of diffResult.addedResults) {
    if (typeof addedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${addedResult.key}`)
    }
    newValue[addedResult.key] = addedResult.value
  }

  for (const updatedResult of diffResult.updatedResults) {
    if (typeof updatedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${updatedResult.key}`)
    }
    newValue[updatedResult.key] = patch(newValue[updatedResult.key], updatedResult)
  }

  for (const deletedResult of diffResult.deletedResults) {
    if (typeof deletedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${deletedResult.key}`)
    }
    delete newValue[deletedResult.key]
  }

  return newValue
}

const patchArray = (oldValue: unknown[], diffResult: ArrayDiffResult): unknown[] => {
  const newValue = [...oldValue]

  // update first
  for (const updatedResult of diffResult.updatedResults) {
    if (typeof updatedResult.key !== 'number') {
      throw new Error(`Expected key to be a number, got ${updatedResult.key}`)
    }
    newValue[updatedResult.key] = patch(newValue[updatedResult.key], updatedResult)
  }

  // delete next
  for (let i = diffResult.deletedResults.length - 1; i >= 0; i--) {
    const deletedResult = diffResult.deletedResults[i]
    if (typeof deletedResult.key !== 'number') {
      throw new Error(`Expected key to be a number, got ${deletedResult.key}`)
    }
    newValue.splice(deletedResult.key, 1)
  }

  // add last to keep the indexes correct
  if (diffResult.addedResults.length > 0) {
    const list = diffResult.addedResults.map((addedResult) => addedResult.value)
    newValue.push(...list)
  }

  return newValue
}

export const patch = (oldValue: unknown, diffResult: UpdatedDiffResult): unknown => {
  if (diffResult === null) {
    return oldValue
  }

  if (diffResult.type === 'object') {
    return patchObject(oldValue as object, diffResult)
  }

  if (diffResult.type === 'array') {
    return patchArray(oldValue as unknown[], diffResult)
  }

  if (diffResult.type === 'changed') {
    return diffResult.value
  }

  throw new Error(`Unknown diff result: ${diffResult}`)
}

const fromSerializableArray = (value: unknown[], yarray?: Y.Array<unknown>): Y.Array<unknown> => {
  const array = yarray ?? new Y.Array()

  for (const item of value) {
    array.push([fromSerializable(item)])
  }

  return array
}

const fromSerializableObject = (value: object, ymap?: Y.Map<unknown>): Y.Map<unknown> => {
  const map = ymap ?? new Y.Map()

  for (const [key, item] of Object.entries(value)) {
    map.set(key, fromSerializable(item))
  }

  return map
}

const fromSerializable = (value: unknown) => {
  if (Array.isArray(value)) {
    return fromSerializableArray(value)
  }

  if (typeof value === 'object' && value !== null) {
    return fromSerializableObject(value)
  }

  if (value === undefined) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value as string | number | boolean
  }

  throw new Error(`Cannot convert ${value} to Yjs type`)
}

const patchYjsArray = (yarray: Y.Array<unknown>, diffResult: ArrayDiffResult) => {
  // update first
  for (const updatedResult of diffResult.updatedResults) {
    if (typeof updatedResult.key !== 'number') {
      throw new Error(`Expected key to be a number, got ${updatedResult.key}`)
    }

    const oldValue = yarray.get(updatedResult.key)
    const updatedValue = patchYjs(oldValue, updatedResult)

    if (updatedValue !== oldValue) {
      yarray.delete(updatedResult.key, 1)
      yarray.insert(updatedResult.key, [updatedValue])
    }
  }

  // delete next
  for (let i = diffResult.deletedResults.length - 1; i >= 0; i--) {
    const deletedResult = diffResult.deletedResults[i]
    if (typeof deletedResult.key !== 'number') {
      throw new Error(`Expected key to be a number, got ${deletedResult.key}`)
    }
    yarray.delete(deletedResult.key, 1)
  }

  // add last to keep the indexes correct
  if (diffResult.addedResults.length > 0) {
    const list = diffResult.addedResults.map((addedResult) => fromSerializable(addedResult.value))
    yarray.push(list)
  }
}

const patchYjsObject = (ymap: Y.Map<unknown>, diffResult: ObjectDiffResult) => {
  for (const addedResult of diffResult.addedResults) {
    if (typeof addedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${addedResult.key}`)
    }
    ymap.set(addedResult.key, fromSerializable(addedResult.value))
  }

  for (const updatedResult of diffResult.updatedResults) {
    if (typeof updatedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${updatedResult.key}`)
    }
    const oldValue = ymap.get(updatedResult.key)
    const updatedValue = patchYjs(oldValue, updatedResult)

    if (updatedValue !== oldValue) {
      ymap.set(updatedResult.key, updatedValue)
    }
  }

  for (const deletedResult of diffResult.deletedResults) {
    if (typeof deletedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${deletedResult.key}`)
    }
    ymap.delete(deletedResult.key)
  }
}

const patchYjs = (value: unknown, diffResult: UpdatedDiffResult) => {
  if (diffResult === null) {
    return value
  }

  if (diffResult.type === 'object') {
    if (value instanceof Y.Map) {
      patchYjsObject(value, diffResult)
      return value
    }
    throw new Error(`Expected value to be a Y.Map, got ${value}`)
  }

  if (diffResult.type === 'array') {
    if (value instanceof Y.Array) {
      patchYjsArray(value, diffResult)
      return value
    }

    throw new Error(`Expected value to be a Y.Array, got ${value}`)
  }

  if (diffResult.type === 'changed') {
    return fromSerializable(diffResult.value)
  }

  throw new Error(`Unknown diff result: ${diffResult}`)
}
