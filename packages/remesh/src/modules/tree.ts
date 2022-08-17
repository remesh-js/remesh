import { Remesh, SerializableObject, DomainConceptName, RemeshDomainContext } from '../'

export type TreeModuleOptions<T extends SerializableObject> = {
  name: DomainConceptName<'TreeModule'>
  getKey: (node: T) => string
  getChildren: (node: T) => T[] | null
  setChildren: (node: T, children: T[]) => T
  default?: T
}

export const findTreeNode = <T extends SerializableObject>(
  root: T,
  options: TreeModuleOptions<T>,
  id: string,
): T | null => {
  if (options.getKey(root) === id) {
    return root
  }

  const children = options.getChildren(root)

  if (!children) {
    return null
  }

  for (const child of children) {
    const found = findTreeNode(child, options, id)
    if (found) {
      return found
    }
  }

  return null
}

export const setTreeNode = <T extends SerializableObject>(current: T, options: TreeModuleOptions<T>, node: T): T => {
  if (options.getKey(current) === node.id) {
    return node
  }

  let hasChanged = false

  const children = options.getChildren(current)

  if (!children) {
    return current
  }

  const newChildren = children.map((child) => {
    const newChild = setTreeNode(child, options, node)
    if (newChild !== child) {
      hasChanged = true
    }
    return newChild
  })

  if (hasChanged) {
    return options.setChildren(current, newChildren)
  }

  return current
}

export const removeTreeNode = <T extends SerializableObject>(
  current: T,
  options: TreeModuleOptions<T>,
  keys: string[],
): T | null => {
  if (keys.includes(options.getKey(current))) {
    return null
  }

  let hasChanged = false

  const children = options.getChildren(current)

  if (!children) {
    return current
  }

  const newChildren = [] as T[]

  for (const child of children) {
    const newChild = removeTreeNode(child, options, keys)
    if (newChild) {
      newChildren.push(newChild)
    } else {
      hasChanged = true
    }
  }

  if (hasChanged) {
    return options.setChildren(current, newChildren)
  }

  return current
}

export const TreeModule = <T extends SerializableObject>(
  domain: RemeshDomainContext,
  options: TreeModuleOptions<T>,
) => {
  const TreeState = domain.state<T | null>({
    name: 'TreeState',
    default: options.default ?? null,
  })

  const TreeRootQuery = domain.query({
    name: 'TreeRootQuery',
    impl: ({ get }) => {
      return get(TreeState())
    },
  })

  const TreeNodeQuery = domain.query({
    name: 'TreeNodeQuery',
    impl: ({ get }, key: string) => {
      const root = get(TreeRootQuery())

      if (!root) {
        return null
      }

      return findTreeNode(root, options, key)
    },
  })

  const SetTreeRootCommand = domain.command({
    name: 'SetTreeRootCommand',
    impl: ({}, root: T) => {
      return [TreeState().new(root)]
    },
  })

  const SetTreeNodeCommand = domain.command({
    name: 'SetTreeNodeCommand',
    impl: ({ get }, newNode: T) => {
      const root = get(TreeRootQuery())

      if (!root) {
        return null
      }

      const newRoot = setTreeNode(root, options, newNode)
      return TreeState().new(newRoot)
    },
  })

  type SetChildrenFailedEventData = {
    key: string
    message: string
  }

  const SetChildrenFailedEvent = domain.event<SetChildrenFailedEventData>({
    name: 'SetChildrenFailedEvent',
  })

  type SetChildrenCommandOptions = {
    key: string
    children: T[]
  }

  const SetChildrenCommand = domain.command({
    name: 'SetChildrenCommand',
    impl: ({ get }, { key, children }: SetChildrenCommandOptions) => {
      const current = get(TreeNodeQuery(key))

      if (!current) {
        return SetChildrenFailedEvent({ key, message: 'Node not found' })
      }

      const newNode = options.setChildren(current, children)

      return SetTreeNodeCommand(newNode)
    },
  })

  const AddChildrenCommand = domain.command({
    name: 'AddChildrenCommand',
    impl: ({ get }, { key, children }: SetChildrenCommandOptions) => {
      const current = get(TreeNodeQuery(key))

      if (!current) {
        return SetChildrenFailedEvent({ key, message: 'Node not found' })
      }

      const newNode = options.setChildren(current, [...(options.getChildren(current) ?? []), ...children])

      return SetTreeNodeCommand(newNode)
    },
  })

  type RemoveTreeNodeFailedEventData = {
    keys: string[]
    message: string
  }

  const RemoveTreeNodeFailedEvent = domain.event<RemoveTreeNodeFailedEventData>({
    name: 'RemoveTreeNodeFailedEvent',
  })

  const RemoveTreeNodeCommand = domain.command({
    name: 'RemoveTreeNodeCommand',
    impl: ({ get }, keys: string[]) => {
      const root = get(TreeRootQuery())

      if (!root) {
        return RemoveTreeNodeFailedEvent({ keys, message: 'Root not found' })
      }

      const newRoot = removeTreeNode(root, options, keys)

      if (!newRoot) {
        return RemoveTreeNodeFailedEvent({ keys, message: `Can't remove root node` })
      }

      return TreeState().new(newRoot)
    },
  })

  return Remesh.module({
    query: {
      TreeRootQuery,
      TreeNodeQuery,
    },
    command: {
      SetTreeRootCommand,
      SetTreeNodeCommand,
      RemoveTreeNodeCommand,
      SetChildrenCommand,
      AddChildrenCommand,
    },
    event: {
      SetChildrenFailedEvent,
      RemoveTreeNodeFailedEvent,
    },
  })
}
