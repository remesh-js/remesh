import { TreeData } from '../types'

const getChildId = (parentId: string, index: number): string =>
  `${parentId !== 'root' ? `${parentId}-` : ''}${index + 1}`

const generateNodes = (parentId: string): TreeData[] => {
  let count = Math.floor(Math.random() * 4 + 1)

  if (parentId === 'root') {
    count = 4
  }

  const nodes = [...Array(count)].map(
    (_, index): TreeData => ({
      id: getChildId(parentId, index),
      name: `Child - ${getChildId(parentId, index)}`,
      children: [],
    }),
  )

  return nodes
}

export function loadNodes(parentId: string) {
  return new Promise<TreeData[]>((resolve, reject) => {
    const timeout = Math.floor(Math.random() * 3000)
    setTimeout(() => {
      if (timeout % 4 === 0) {
        reject(new Error('Failed to load nodes'))
      } else {
        resolve(generateNodes(parentId))
      }
    }, timeout)
  })
}
