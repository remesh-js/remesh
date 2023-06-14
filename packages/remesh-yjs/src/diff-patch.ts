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
  | AddedDiffResult
  | DeletedDiffResult
  | ChangedDiffResult
  | null

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
      // @ts-ignore pass it
    } else if (oldObject[key] !== value) {
      // @ts-ignore pass it
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

export const diff = (oldValue: unknown, newValue: unknown, key?: string | number): UpdatedDiffResult | null => {
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

export const patchObject = (oldValue: object, diffResult: ObjectDiffResult): object => {
  const newValue = { ...oldValue }

  for (const addedResult of diffResult.addedResults) {
    if (typeof addedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${addedResult.key}`)
    }
    // @ts-ignore pass it
    newValue[addedResult.key] = addedResult.value
  }

  for (const updatedResult of diffResult.updatedResults) {
    if (typeof updatedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${updatedResult.key}`)
    }
    // @ts-ignore pass it
    newValue[updatedResult.key] = patch(newValue[updatedResult.key], updatedResult)
  }

  for (const deletedResult of diffResult.deletedResults) {
    if (typeof deletedResult.key !== 'string') {
      throw new Error(`Expected key to be a string, got ${deletedResult.key}`)
    }
    // @ts-ignore pass it
    delete newValue[deletedResult.key]
  }

  return newValue
}

export const patchArray = (oldValue: unknown[], diffResult: ArrayDiffResult): unknown[] => {
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

export const patch = (oldValue: unknown, diffResult: UpdatedDiffResult | null): unknown => {
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
