import * as Y from 'yjs'
import { diff } from '../src//diff-patch'
import { fromSerializable, yjsToJson, patchYjs, fromYjs } from '../src/json-yjs-converter'

describe('json-yjs-converter', () => {
  it('should convert yjs to observable', () => {
    const doc = new Y.Doc()
    const yjsValue = doc.getArray('test')
    const observable = fromYjs(yjsValue)

    const fn = jest.fn()

    observable.subscribe(fn)

    yjsValue.push([1, 2, 3])
    expect(fn).toBeCalledWith([1, 2, 3])

    yjsValue.delete(0, 1)
    expect(fn).toBeCalledWith([2, 3])
  })

  it('should convert yjs to json', () => {
    const doc = new Y.Doc()
    const yjsValue = doc.getMap('test')
    yjsValue.set('a', 1)
    yjsValue.set('b', 2)
    yjsValue.set('c', 3)

    const jsonValue = yjsToJson(yjsValue)

    expect(jsonValue).toEqual({
      a: 1,
      b: 2,
      c: 3,
    })

    expect(yjsToJson(yjsValue)).toBe(jsonValue)

    yjsValue.set('c', 4)

    const jsonValue2 = yjsToJson(yjsValue)

    expect(jsonValue2).toEqual({
      a: 1,
      b: 2,
      c: 4,
    })

    expect(jsonValue2).not.toBe(jsonValue)
  })

  it('should convert yjs array to json', () => {
    const doc = new Y.Doc()
    const yjsValue = doc.getArray('test')

    yjsValue.push([1, 2, 3])

    const jsonValue = yjsToJson(yjsValue)
    expect(jsonValue).toEqual([1, 2, 3])

    yjsValue.delete(0, 1)

    const jsonValue2 = yjsToJson(yjsValue)
    expect(jsonValue2).toEqual([2, 3])
  })

  it('should convert json object to yjs', () => {
    const doc = new Y.Doc()
    const yjsMap = doc.getMap('test')
    const jsonValue = {
      a: 1,
      b: 2,
      c: 3,
    }
    const yjsValue = fromSerializable(jsonValue)
    yjsMap.set('test', yjsValue)
    expect(yjsValue).toBeInstanceOf(Y.Map)
    expect(yjsValue.toJSON()).toEqual(jsonValue)
  })

  it('should convert json array to yjs', () => {
    const doc = new Y.Doc()
    const yjsArray = doc.getArray('test')
    const jsonValue = [1, 2, 3]
    const yjsValue = fromSerializable(jsonValue)
    yjsArray.push([yjsValue])
    expect(yjsValue).toBeInstanceOf(Y.Array)
    expect(yjsValue.toJSON()).toEqual(jsonValue)
  })

  it('should convert json object to yjs and back', () => {
    const doc = new Y.Doc()
    const yjsMap = doc.getMap('test')
    const jsonValue = {
      a: 1,
      b: 2,
      c: 3,
    }
    const yjsValue = fromSerializable(jsonValue)
    yjsMap.set('test', yjsValue)
    const jsonValue2 = yjsToJson(yjsValue)
    expect(jsonValue2).toEqual(jsonValue)
  })

  it('should convert json array to yjs and back', () => {
    const doc = new Y.Doc()
    const yjsArray = doc.getArray('test')
    const jsonValue = [1, 2, 3]
    const yjsValue = fromSerializable(jsonValue)
    yjsArray.push([yjsValue])
    const jsonValue2 = yjsToJson(yjsValue)
    expect(jsonValue2).toEqual(jsonValue)
  })

  it('should convert json object to yjs and back and patch', () => {
    const doc = new Y.Doc()
    const yjsMap = doc.getMap('test')
    const jsonValue = {
      a: 1,
      b: 2,
      c: 3,
    }
    const yjsValue = fromSerializable(jsonValue)
    yjsMap.set('test', yjsValue)
    const jsonValue2 = {
      a: 1,
      b: 2,
      c: 4,
    }
    const diffResult = diff(jsonValue, jsonValue2)
    patchYjs(yjsValue, diffResult)

    const jsonValue3 = yjsToJson(yjsValue)
    expect(jsonValue3).toEqual(jsonValue2)
  })

  it('should convert json array to yjs and back and patch', () => {
    const doc = new Y.Doc()
    const yjsArray = doc.getArray('test')
    const jsonValue = [1, 2, 3]
    const yjsValue = fromSerializable(jsonValue)
    yjsArray.push([yjsValue])
    const jsonValue2 = [1, 2, 4]
    const diffResult = diff(jsonValue, jsonValue2)
    patchYjs(yjsValue, diffResult)
    const jsonValue3 = yjsToJson(yjsValue)
    expect(jsonValue3).toEqual(jsonValue2)
  })
})
