import * as Y from 'yjs'
import { diff } from '../src//diff-patch'
import { fromSerializable, patchYjs } from '../src/json-yjs-converter'

describe('json-yjs-converter', () => {
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
    const jsonValue2 = yjsValue.toJSON()
    expect(jsonValue2).toEqual(jsonValue)
  })

  it('should convert json array to yjs and back', () => {
    const doc = new Y.Doc()
    const yjsArray = doc.getArray('test')
    const jsonValue = [1, 2, 3]
    const yjsValue = fromSerializable(jsonValue)
    yjsArray.push([yjsValue])
    const jsonValue2 = yjsValue.toJSON()
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

    const jsonValue3 = yjsValue.toJSON()
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
    const jsonValue3 = yjsValue.toJSON()
    expect(jsonValue3).toEqual(jsonValue2)
  })
})
