import { Remesh, RemeshDomainContext, RemeshCommandContext, RemeshAction, RemeshQueryContext } from 'remesh'

import * as Y from 'yjs'

import { merge } from 'rxjs'
import { map } from 'rxjs/operators'

import { diff, patch } from './diff-patch'
import { fromYjs, patchYjs, yjsToJson } from './json-yjs-converter'
import { SerializableType } from './types'

export const origin = 'from-remesh-yjs'

export type RemeshYjsExtern = {
  doc: Y.Doc
}

export const RemeshYjsExtern = Remesh.extern<RemeshYjsExtern | null>({
  default: null,
})

export type RemeshYjOptions<T extends SerializableType> = {
  key: string
  inspectable?: boolean
  dataType: T extends unknown[] ? 'array' : 'object'
  onSend: (context: RemeshQueryContext) => T
  onReceive: (context: RemeshCommandContext, value: T) => RemeshAction
}

export const RemeshYjs = <T extends SerializableType>(domain: RemeshDomainContext, options: RemeshYjOptions<T>) => {
  const inspectable = options.inspectable ?? false
  const yjsExtern = domain.getExtern(RemeshYjsExtern)

  if (yjsExtern === null) {
    return
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
    inspectable,
  })

  const SendEvent = Remesh.event<T>({
    name: 'SendEvent',
    inspectable,
  })

  const DataForSyncQuery = domain.query({
    name: 'DataForSyncQuery',
    inspectable,
    impl: options.onSend,
  })

  const SyncDataCommand = domain.command({
    name: 'SyncDataCommand',
    inspectable,
    impl: (ctx, data: T) => {
      return [options.onReceive(ctx, data), ReceivedEvent(data)]
    },
  })

  domain.effect({
    name: `YjsEffect`,
    inspectable,
    impl: ({ get, fromQuery }) => {
      const { doc } = yjsExtern

      const yjsValue = getYjsValue(doc)

      const send$ = fromQuery(DataForSyncQuery()).pipe(
        map((value) => {
          assertDataType(value)
          const currentJson = yjsToJson(yjsValue)
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
