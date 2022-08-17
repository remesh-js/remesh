import './style.css'

import { TreeNode } from './components/TreeNode'

import { useEffect } from 'react'

import { useRemeshDomain, useRemeshSend } from 'remesh-react'

import { TreeDomain } from './domains/TreeDomain'

export function TreeApp() {
  const send = useRemeshSend()
  const treeDomain = useRemeshDomain(TreeDomain())

  useEffect(() => {
    send(treeDomain.command.LoadNodesCommand('root'))
  }, [])

  return (
    <div>
      <h1>Async Tree View</h1>
      <TreeNode id="root" />
    </div>
  )
}
