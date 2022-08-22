import { diff, patch } from '../src/diff-patch'

describe('diff-patch', () => {
  it('should diff and patch objects', () => {
    const oldValue = {
      a: 1,
      b: 2,
      c: 3,
    }
    const newValue = {
      a: 1,
      b: 2,
      c: 4,
    }
    const diffResult = diff(oldValue, newValue)
    expect(diffResult).toEqual({
      type: 'object',
      addedResults: [],
      deletedResults: [],
      updatedResults: [
        {
          type: 'changed',
          key: 'c',
          value: 4,
        },
      ],
    })
    const patchedValue = patch(oldValue, diffResult)
    expect(patchedValue).toEqual(newValue)
  })

  it('should diff and patch arrays', () => {
    const oldValue = [1, 2, 3]
    const newValue = [1, 2, 4]
    const diffResult = diff(oldValue, newValue)
    expect(diffResult).toEqual({
      type: 'array',
      key: undefined,
      addedResults: [],
      deletedResults: [],
      updatedResults: [
        {
          type: 'changed',
          key: 2,
          value: 4,
        },
      ],
    })
    const patchedValue = patch(oldValue, diffResult)
    expect(patchedValue).toEqual(newValue)
  })

  it('should diff and patch arrays with added and deleted items', () => {
    const oldValue = [1, 2, 3]
    const newValue = [1, 4, 5, 6]
    const diffResult = diff(oldValue, newValue)

    expect(diffResult).toEqual({
      type: 'array',
      key: undefined,
      addedResults: [{ type: 'added', key: 3, value: 6 }],
      deletedResults: [],
      updatedResults: [
        { type: 'changed', key: 1, value: 4 },
        { type: 'changed', key: 2, value: 5 },
      ],
    })
    const patchedValue = patch(oldValue, diffResult)

    expect(patchedValue).toEqual(newValue)
  })

  it('should diff and patch arrays with added and deleted items and updated items', () => {
    const oldValue = [1, 2, 3]
    const newValue = [1, 4, 5, 6, 7]
    const diffResult = diff(oldValue, newValue)

    expect(diffResult).toEqual({
      type: 'array',
      key: undefined,
      addedResults: [
        { type: 'added', key: 3, value: 6 },
        { type: 'added', key: 4, value: 7 },
      ],
      deletedResults: [],
      updatedResults: [
        { type: 'changed', key: 1, value: 4 },
        { type: 'changed', key: 2, value: 5 },
      ],
    })
    const patchedValue = patch(oldValue, diffResult)

    expect(patchedValue).toEqual(newValue)
  })

  it('should support mix and nest object/array in complex data structure', () => {
    const oldValue = {
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: 4,
        f: [1, 2, 3],
      },
    }
    const newValue = {
      a: 1,
      c: {
        d: 3,
        e: ['a', 'b'],
        f: [1, 2, 4],
        g: false,
      },
    }
    const diffResult = diff(oldValue, newValue)

    expect(diffResult).toEqual({
      type: 'object',
      addedResults: [],
      deletedResults: [
        {
          type: 'deleted',
          key: 'b',
        },
      ],
      updatedResults: [
        {
          type: 'object',
          key: 'c',
          addedResults: [
            {
              type: 'added',
              key: 'g',
              value: false,
            },
          ],
          deletedResults: [],
          updatedResults: [
            {
              type: 'changed',
              key: 'e',
              value: ['a', 'b'],
            },
            {
              type: 'array',
              key: 'f',
              addedResults: [],
              deletedResults: [],
              updatedResults: [
                {
                  type: 'changed',
                  key: 2,
                  value: 4,
                },
              ],
            },
          ],
        },
      ],
    })
    const patchedValue = patch(oldValue, diffResult)
    expect(patchedValue).toEqual(newValue)
  })

  it('should return null if no diff', () => {
    const oldValue = {
      a: 1,
      b: 2,
      c: 3,
    }
    const newValue = {
      a: 1,
      b: 2,
      c: 3,
    }
    const diffResult = diff(oldValue, newValue)
    expect(diffResult).toEqual(null)
  })
})
