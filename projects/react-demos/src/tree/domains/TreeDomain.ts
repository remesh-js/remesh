import { Remesh } from 'remesh'

import { ListModule } from 'remesh/modules/list'
import { AsyncModule } from 'remesh/modules/async'
import { TreeModule } from 'remesh/modules/tree'

import { TreeData } from '../types'
import { loadNodes } from '../apis/loadNodes'

export type TreeStatus =
  | {
      type: 'loading'
      id: string
    }
  | {
      type: 'error'
      id: string
    }

export const TreeDomain = Remesh.domain({
  name: 'TreeDomain',
  impl: (domain) => {
    const defaultTreeData: TreeData = {
      id: 'root',
      name: 'Root',
      children: [],
    }

    const MyTreeModule = TreeModule<TreeData>(domain, {
      name: 'MyTreeModule',
      getKey: (node) => node.id,
      getChildren: (node) => node.children ?? null,
      setChildren: (node, children) => ({ ...node, children }),
      default: defaultTreeData,
    })

    const TreeStatusListModule = ListModule<TreeStatus>(domain, {
      name: 'TreeStatusListModule',
      key: (treeStatus) => treeStatus.id.toString(),
    })

    const TreeAsyncModule = AsyncModule(domain, {
      name: 'TreeAsyncModule',
      mode: 'merge',
      load: ({}, targetId: string) => {
        return loadNodes(targetId)
      },
      onLoading: ({get}, targetId) => {
        return TreeStatusListModule.command.UpsertItemCommand({
          type: 'loading',
          id: targetId,
        })
      },
      onSuccess: ({}, children, targetId) => {
        return [
          TreeStatusListModule.command.DeleteItemCommand(targetId),
          MyTreeModule.command.AddChildrenCommand({
            key: targetId,
            children,
          }),
        ]
      },
      onFailed: ({}, _error, targetId) => {
        return TreeStatusListModule.command.UpdateItemCommand({
          type: 'error',
          id: targetId,
        })
      },
    })

    const TreeStatusQuery = domain.query({
      name: 'TreeStatusQuery',
      impl: ({ get }, targetId: string) => {
        const statusList = get(TreeStatusListModule.query.ItemListQuery())
        return statusList.find((status) => status.id === targetId)
      },
    })

    return {
      query: {
        TreeStatusQuery,
        TreeRootQuery: MyTreeModule.query.TreeRootQuery,
        TreeNodeQuery: MyTreeModule.query.TreeNodeQuery,
      },
      command: {
        SetTreeRootCommand: MyTreeModule.command.SetTreeRootCommand,
        SetTreeNodeCommand: MyTreeModule.command.SetTreeNodeCommand,
        RemoveTreeNodeCommand: MyTreeModule.command.RemoveTreeNodeCommand,
        SetChildrenCommand: MyTreeModule.command.SetChildrenCommand,
        AddChildrenCommand: MyTreeModule.command.AddChildrenCommand,
        LoadNodesCommand: TreeAsyncModule.command.LoadCommand,
      },
      event: {
        SetChildrenFailedEvent: MyTreeModule.event.SetChildrenFailedEvent,
        RemoveTreeNodeFailedEvent: MyTreeModule.event.RemoveTreeNodeFailedEvent,
      },
    }
  },
})
