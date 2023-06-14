const deepEqualList = (left: unknown[], right: unknown[]): boolean => {
  if (left.length !== right.length) {
    return false
  }

  for (let i = 0; i < left.length; i++) {
    if (!deepEqual(left[i], right[i])) {
      return false
    }
  }
  return true
}

const deepEqualObject = (left: object | null, right: object | null): boolean => {
  if (left === null || right === null) {
    return false
  }

  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  if (!deepEqualList(leftKeys, rightKeys)) {
    return false
  }

  for (const key of leftKeys) {
    // @ts-ignore pass it
    if (!deepEqual(left[key], right[key])) {
      return false
    }
  }

  return true
}

export const deepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return deepEqualList(left, right)
  }

  if (typeof left === 'object' && typeof right === 'object') {
    return deepEqualObject(left, right)
  }

  return left === right
}
