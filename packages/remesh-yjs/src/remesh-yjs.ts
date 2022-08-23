import {
  Remesh,
  RemeshDomainContext,
  RemeshCommandContext,
  RemeshAction,
  RemeshQueryContext,
  RemeshExtern,
} from 'remesh'

import * as Y from 'yjs'

import { merge, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { diff, patch, UpdatedDiffResult } from './diff-patch'
import { patchYjs } from './json-yjs-converter'
import { SerializableType } from './types'

export const FROM_REMESH_YJS = 'from-remesh-yjs'

const fromYjs = (yjsValue: Y.AbstractType<any>) => {
  return new Observable<SerializableType>((subscriber) => {
    const handler = (_yevents: Y.YEvent<Y.AbstractType<unknown>>[], transaction: Y.Transaction) => {
      if (transaction.origin !== FROM_REMESH_YJS) {
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

export const createYjsExtern = () => {
  return Remesh.extern<RemeshYjsExtern | null>({
    default: null,
  })
}

export const RemeshYjsExtern = createYjsExtern()

export type RemeshYjOptions<T extends SerializableType> = {
  key: string
  extern?: RemeshExtern<RemeshYjsExtern | null>
  inspectable?: boolean
  dataType: T extends unknown[] ? 'array' : 'object'
  onSend: (context: RemeshQueryContext) => T
  onReceive: (context: RemeshCommandContext, value: T) => RemeshAction
}

export const RemeshYjs = <T extends SerializableType>(domain: RemeshDomainContext, options: RemeshYjOptions<T>) => {
  const inspectable = options.inspectable ?? false
  const yjsExtern = domain.getExtern(options.extern ?? RemeshYjsExtern)

  if (yjsExtern === null) {
    return
  }

  const { doc } = yjsExtern

  function assertDataType(value: unknown): asserts value is T {
    if (Array.isArray(value) && options.dataType === 'array') {
      return
    }

    if (value !== null && typeof value === 'object' && options.dataType === 'object') {
      return
    }

    throw new Error(`Expected value to be of type ${options.dataType}, got ${value}`)
  }

  const yjsValue = doc.get(options.key, options.dataType === 'object' ? Y.Map : Y.Array)

  const updateYjsValue = (diffResult: UpdatedDiffResult | null, origin: unknown, local?: boolean) => {
    Y.transact(
      doc,
      () => {
        patchYjs(yjsValue, diffResult)
      },
      origin,
      local,
    )
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
      const send$ = fromQuery(DataForSyncQuery()).pipe(
        map((value) => {
          assertDataType(value)
          const currentJson = yjsValue.toJSON()
          const diffResult = diff(currentJson, value)

          if (diffResult === null) {
            return null
          }

          updateYjsValue(diffResult, FROM_REMESH_YJS)

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
