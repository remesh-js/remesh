import { useState } from 'react'

import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { ExpandIcon } from './ExpandIcon'
import { CollapseIcon } from './CollapseIcon'

import { TreeDomain } from '../domains/TreeDomain'

export type TreeIconProps = {
  expanded: boolean
}

export const TreeIcon = (props: TreeIconProps) => {
  if (props.expanded) {
    return <ExpandIcon />
  } else {
    return <CollapseIcon />
  }
}

export type TreeNodeProps = {
  id: string
}

export const TreeNode = (props: TreeNodeProps) => {
  const send = useRemeshSend()
  const treeDomain = useRemeshDomain(TreeDomain())
  const treeData = useRemeshQuery(treeDomain.query.TreeNodeQuery(props.id))
  const treeStatus = useRemeshQuery(treeDomain.query.TreeStatusQuery(props.id))

  const [expanded, setExpanded] = useState(true)

  if (!treeData) {
    return null
  }

  if (treeStatus && treeStatus.type === 'loading') {
    return <div className="title">Loading...</div>
  }

  if (treeStatus && treeStatus.type === 'error') {
    const handleRetry = () => {
      send(treeDomain.command.LoadNodesCommand(props.id))
    }
    return (
      <div className="title" onClick={handleRetry}>
        Failed to load more nodes, click to retry
      </div>
    )
  }

  const hasChildren = !!treeData.children && treeData.children.length > 0

  const handleExpand = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    } else {
      send(treeDomain.command.LoadNodesCommand(props.id))
    }
  }

  return (
    <div>
      <div className="title" onClick={handleExpand}>
        <span className="toggle">{hasChildren && <TreeIcon expanded={expanded} />}</span>
        {treeData.name}
      </div>
      <div className="sub-nodes">
        {expanded &&
          !!treeData.children &&
          treeData.children.map((subnode) => {
            return <TreeNode key={subnode.id} id={subnode.id} />
          })}
      </div>
    </div>
  )
}
