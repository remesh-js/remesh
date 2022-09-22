import { Remesh, RemeshStore } from '../src'
import { AsyncModule, AsyncData } from '../src/modules/async'
import { ListModule } from '../src/modules/list'
import { TreeModule } from '../src/modules/tree'
import { HistoryModule } from '../src/modules/history'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('modules', () => {
  let store: RemeshStore

  beforeEach(() => {
    store = RemeshStore({
      name: 'store',
    })
  })

  afterEach(() => {
    store.discard()
  })

  it('async-module', async () => {
    let load: (arg: string, arg1: number) => Promise<number> = () => {
      return Promise.resolve(0)
    }

    const onSuccess = jest.fn()
    const onFailed = jest.fn()
    const onCanceled = jest.fn()
    const onChanged = jest.fn()
    const onLoading = jest.fn()

    const TestDomain = Remesh.domain({
      name: 'TestDomain',
      impl: (domain) => {
        const ArgState = domain.state({
          name: 'ArgState',
          default: '',
        })

        const TestAsync = AsyncModule(domain, {
          name: 'TestAsyncModule',
          load: async ({ get }, arg: number) => {
            const result = await load(get(ArgState()), arg)
            return result
          },
          onSuccess,
          onFailed,
          onCanceled,
          onChanged,
          onLoading,
        })

        return TestAsync
      },
    })

    const domain = store.getDomain(TestDomain())

    store.igniteDomain(TestDomain())

    const successEventListener = jest.fn()
    const failedEventListener = jest.fn()
    const canceledEventListener = jest.fn()
    const loadingEventListener = jest.fn()
    const changedEventListener = jest.fn()

    store.subscribeEvent(domain.event.SuccessEvent, successEventListener)
    store.subscribeEvent(domain.event.FailedEvent, failedEventListener)
    store.subscribeEvent(domain.event.CanceledEvent, canceledEventListener)
    store.subscribeEvent(domain.event.LoadingEvent, loadingEventListener)
    store.subscribeEvent(domain.event.ChangedEvent, changedEventListener)

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.default())

    store.send(domain.command.LoadCommand(0))

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.loading())
    expect(loadingEventListener).toHaveBeenCalledTimes(1)
    expect(onLoading).toHaveBeenCalledTimes(1)

    await delay(1)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onFailed).toHaveBeenCalledTimes(0)
    expect(onCanceled).toHaveBeenCalledTimes(0)

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.success(0))

    expect(successEventListener).toHaveBeenCalledTimes(1)
    expect(failedEventListener).toHaveBeenCalledTimes(0)
    expect(canceledEventListener).toHaveBeenCalledTimes(0)
    expect(loadingEventListener).toHaveBeenCalledTimes(1)
    expect(changedEventListener).toHaveBeenCalledTimes(2)

    load = (_arg, _arg1) => {
      throw new Error('error')
    }

    store.send(domain.command.LoadCommand(1))

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.loading())
    expect(loadingEventListener).toHaveBeenCalledTimes(2)
    expect(onLoading).toHaveBeenCalledTimes(2)

    await delay(1)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onFailed).toHaveBeenCalledTimes(1)
    expect(onCanceled).toHaveBeenCalledTimes(0)

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.failed(new Error('error')))

    expect(successEventListener).toHaveBeenCalledTimes(1)
    expect(failedEventListener).toHaveBeenCalledTimes(1)
    expect(canceledEventListener).toHaveBeenCalledTimes(0)
    expect(loadingEventListener).toHaveBeenCalledTimes(2)
    expect(changedEventListener).toHaveBeenCalledTimes(4)

    load = async () => {
      await delay(10)
      return 1
    }

    store.send(domain.command.LoadCommand(2))

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.loading())
    expect(loadingEventListener).toHaveBeenCalledTimes(3)
    expect(onLoading).toHaveBeenCalledTimes(3)

    await delay(1)

    store.send(domain.command.CancelCommand())

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.canceled())
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onFailed).toHaveBeenCalledTimes(1)
    expect(onCanceled).toHaveBeenCalledTimes(1)
    expect(onLoading).toHaveBeenCalledTimes(3)
    expect(onChanged).toHaveBeenCalledTimes(6)

    expect(successEventListener).toHaveBeenCalledTimes(1)
    expect(failedEventListener).toHaveBeenCalledTimes(1)
    expect(canceledEventListener).toHaveBeenCalledTimes(1)
    expect(loadingEventListener).toHaveBeenCalledTimes(3)
    expect(changedEventListener).toHaveBeenCalledTimes(6)

    store.send(domain.command.ReloadCommand())

    expect(store.query(domain.query.AsyncDataQuery())).toEqual(AsyncData.loading())
    expect(loadingEventListener).toHaveBeenCalledTimes(4)
    expect(onLoading).toHaveBeenCalledTimes(4)

    await delay(20)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onFailed).toHaveBeenCalledTimes(1)
    expect(onCanceled).toHaveBeenCalledTimes(1)
    expect(onLoading).toHaveBeenCalledTimes(4)
    expect(onChanged).toHaveBeenCalledTimes(8)

    expect(successEventListener).toHaveBeenCalledTimes(2)
    expect(failedEventListener).toHaveBeenCalledTimes(1)
    expect(canceledEventListener).toHaveBeenCalledTimes(1)
    expect(loadingEventListener).toHaveBeenCalledTimes(4)
    expect(changedEventListener).toHaveBeenCalledTimes(8)
  })

  it('list-module', () => {
    type Todo = {
      id: number
      text: string
      completed: boolean
    }

    const TestDomain = Remesh.domain({
      name: 'TestDomain',
      impl: (domain) => {
        const TodoListModule = ListModule<Todo>(domain, {
          name: 'TodoListModule',
          key: (todo) => todo.id.toString(),
          default: [
            { id: 0, text: 'todo0', completed: false },
            { id: 1, text: 'todo1', completed: false },
          ],
        })

        return TodoListModule
      },
    })

    const domain = store.getDomain(TestDomain())

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0', completed: false },
      { id: 1, text: 'todo1', completed: false },
    ])

    expect(store.query(domain.query.ItemQuery('0'))).toEqual({ id: 0, text: 'todo0', completed: false })
    expect(store.query(domain.query.ItemQuery('1'))).toEqual({ id: 1, text: 'todo1', completed: false })

    store.send(domain.command.AddItemCommand({ id: 2, text: 'todo2', completed: false }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0', completed: false },
      { id: 1, text: 'todo1', completed: false },
      { id: 2, text: 'todo2', completed: false },
    ])

    store.send(domain.command.AddItemCommand({ id: 3, text: 'todo3', completed: false }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0', completed: false },
      { id: 1, text: 'todo1', completed: false },
      { id: 2, text: 'todo2', completed: false },
      { id: 3, text: 'todo3', completed: false },
    ])

    store.send(domain.command.DeleteItemCommand('0'))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1', completed: false },
      { id: 2, text: 'todo2', completed: false },
      { id: 3, text: 'todo3', completed: false },
    ])

    store.send(domain.command.UpdateItemCommand({ id: 1, text: 'todo1-updated', completed: true }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2', completed: false },
      { id: 3, text: 'todo3', completed: false },
    ])

    store.send(domain.command.UpdateItemCommand({ id: 2, text: 'todo2-updated', completed: true }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2-updated', completed: true },
      { id: 3, text: 'todo3', completed: false },
    ])

    store.send(
      domain.command.AddItemListCommand([
        { id: 4, text: 'todo4', completed: false },
        { id: 5, text: 'todo5', completed: false },
      ]),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2-updated', completed: true },
      { id: 3, text: 'todo3', completed: false },
      { id: 4, text: 'todo4', completed: false },
      { id: 5, text: 'todo5', completed: false },
    ])

    store.send(domain.command.AddItemListCommand([]))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2-updated', completed: true },
      { id: 3, text: 'todo3', completed: false },
      { id: 4, text: 'todo4', completed: false },
      { id: 5, text: 'todo5', completed: false },
    ])

    store.send(domain.command.DeleteItemListCommand(['1', '2', '5']))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 3, text: 'todo3', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    store.send(
      domain.command.UpdateItemListCommand([
        { id: 3, text: 'todo3-updated', completed: true },
        { id: 4, text: 'todo4-updated', completed: true },
      ]),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 3, text: 'todo3-updated', completed: true },
      { id: 4, text: 'todo4-updated', completed: true },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['3', '4'])

    store.send(domain.command.DeleteItemListCommand(['3', '4']))

    expect(store.query(domain.query.ItemListQuery())).toEqual([])

    expect(store.query(domain.query.KeyListQuery())).toEqual([])

    store.send(
      domain.command.SetListCommand([
        { id: 3, text: 'todo3', completed: false },
        { id: 4, text: 'todo4', completed: false },
      ]),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 3, text: 'todo3', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['3', '4'])

    store.send(
      domain.command.InsertAfterCommand({
        after: store.query(domain.query.ItemQuery('3')),
        item: { id: 5, text: 'todo5', completed: false },
      }),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 3, text: 'todo3', completed: false },
      { id: 5, text: 'todo5', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['3', '5', '4'])

    store.send(
      domain.command.InsertBeforeCommand({
        before: store.query(domain.query.ItemQuery('3')),
        item: { id: 6, text: 'todo6', completed: false },
      }),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 6, text: 'todo6', completed: false },
      { id: 3, text: 'todo3', completed: false },
      { id: 5, text: 'todo5', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['6', '3', '5', '4'])

    store.send(
      domain.command.InsertAtCommand({
        index: 1,
        item: { id: 7, text: 'todo7', completed: false },
      }),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 6, text: 'todo6', completed: false },
      { id: 7, text: 'todo7', completed: false },
      { id: 3, text: 'todo3', completed: false },
      { id: 5, text: 'todo5', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['6', '7', '3', '5', '4'])

    store.send(domain.command.ResetCommand())

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0', completed: false },
      { id: 1, text: 'todo1', completed: false },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['0', '1'])

    store.send(
      domain.command.UpsertItemCommand({
        id: 0,
        text: 'todo0-update',
        completed: false,
      }),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0-update', completed: false },
      { id: 1, text: 'todo1', completed: false },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['0', '1'])

    store.send(
      domain.command.UpsertItemCommand({
        id: 2,
        text: 'todo2',
        completed: false,
      }),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0-update', completed: false },
      { id: 1, text: 'todo1', completed: false },
      {
        id: 2,
        text: 'todo2',
        completed: false,
      },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['0', '1', '2'])

    store.send(
      domain.command.UpsertItemListCommand([
        {
          id: 3,
          text: 'todo3',
          completed: false,
        },
        {
          id: 2,
          text: 'todo2',
          completed: false,
        },
      ]),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0-update', completed: false },
      { id: 1, text: 'todo1', completed: false },
      {
        id: 2,
        text: 'todo2',
        completed: false,
      },
      {
        id: 3,
        text: 'todo3',
        completed: false,
      },
    ])

    expect(store.query(domain.query.KeyListQuery())).toEqual(['0', '1', '2', '3'])
  })

  it('tree-module', () => {
    type Tree = {
      id: string
      name: string
      children: Tree[]
    }

    const TreeDomain = Remesh.domain({
      name: 'TreeDomain',
      impl: (domain) => {
        const MyTreeModule = TreeModule(domain, {
          name: 'MyTreeModule',
          getKey: (tree: Tree) => tree.id,
          getChildren: (tree: Tree) => tree.children,
          setChildren: (tree: Tree, children: Tree[]) => ({
            ...tree,
            children,
          }),
        })

        return MyTreeModule
      },
    })

    const store = Remesh.store()
    const treeDomain = store.getDomain(TreeDomain())

    let tree = store.query(treeDomain.query.TreeRootQuery())

    const SetChildrenFailedEventCallback = jest.fn()
    const RemoveTreeNodeFailedEventCallback = jest.fn()

    store.subscribeEvent(treeDomain.event.SetChildrenFailedEvent, SetChildrenFailedEventCallback)
    store.subscribeEvent(treeDomain.event.RemoveTreeNodeFailedEvent, RemoveTreeNodeFailedEventCallback)

    expect(tree).toEqual(null)

    store.send(
      treeDomain.command.SetTreeRootCommand({
        id: '0',
        name: 'root',
        children: [
          {
            id: '1',
            name: 'child1',
            children: [],
          },
          {
            id: '2',
            name: 'child2',
            children: [],
          },
        ],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [],
        },
      ],
    })

    store.send(
      treeDomain.command.SetTreeNodeCommand({
        id: '1',
        name: 'child1-updated',
        children: [],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1-updated',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [],
        },
      ],
    })

    store.send(
      treeDomain.command.SetTreeNodeCommand({
        id: '3',
        name: 'child3',
        children: [],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1-updated',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [],
        },
      ],
    })

    store.send(
      treeDomain.command.SetChildrenCommand({
        key: '2',
        children: [
          {
            id: '3',
            name: 'child3',
            children: [],
          },
        ],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1-updated',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [
            {
              id: '3',
              name: 'child3',
              children: [],
            },
          ],
        },
      ],
    })

    store.send(
      treeDomain.command.SetChildrenCommand({
        key: '20',
        children: [
          {
            id: '3',
            name: 'child3-updated',
            children: [],
          },
        ],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(SetChildrenFailedEventCallback).toBeCalledTimes(1)

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1-updated',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [
            {
              id: '3',
              name: 'child3',
              children: [],
            },
          ],
        },
      ],
    })

    store.send(
      treeDomain.command.SetChildrenCommand({
        key: '2',
        children: [
          {
            id: '3',
            name: 'child3-updated',
            children: [],
          },
        ],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1-updated',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [
            {
              id: '3',
              name: 'child3-updated',
              children: [],
            },
          ],
        },
      ],
    })

    store.send(
      treeDomain.command.AddChildrenCommand({
        key: '2',
        children: [
          {
            id: '4',
            name: 'child4',
            children: [],
          },
        ],
      }),
    )

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '1',
          name: 'child1-updated',
          children: [],
        },
        {
          id: '2',
          name: 'child2',
          children: [
            {
              id: '3',
              name: 'child3-updated',
              children: [],
            },
            {
              id: '4',
              name: 'child4',
              children: [],
            },
          ],
        },
      ],
    })

    store.send(treeDomain.command.RemoveTreeNodeCommand(['1', '3', '4']))

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [
        {
          id: '2',
          name: 'child2',
          children: [],
        },
      ],
    })

    store.send(treeDomain.command.RemoveTreeNodeCommand(['2']))

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [],
    })

    store.send(treeDomain.command.RemoveTreeNodeCommand(['0']))

    expect(RemoveTreeNodeFailedEventCallback).toBeCalledTimes(1)

    tree = store.query(treeDomain.query.TreeRootQuery())

    expect(tree).toEqual({
      id: '0',
      name: 'root',
      children: [],
    })
  })

  it('history-module', () => {
    type Todo = {
      id: number
      content: string
      completed: boolean
    }

    const TestHistoryDomain = Remesh.domain({
      name: 'TestHistoryDomain',
      impl: (domain) => {
        const TodoListState = domain.state<Todo[]>({
          name: 'TodoListState',
          default: [],
        })

        const TodoListQuery = domain.query({
          name: 'TodoListQuery',
          impl: ({ get }) => {
            return get(TodoListState())
          },
        })

        const SetTodoListCommand = domain.command({
          name: 'SetTodoListCommand',
          impl: ({}, newTodoList: Todo[]) => {
            return TodoListState().new(newTodoList)
          },
        })

        const AddTodoCommand = domain.command({
          name: 'SetTodoListCommand',
          impl: ({ get }, newTodo: Todo) => {
            const todoList = get(TodoListState())
            return SetTodoListCommand([...todoList, newTodo])
          },
        })

        const RemoveTodoTodoCommand = domain.command({
          name: 'RemoveTodoTodoCommand',
          impl: ({ get }, id: number) => {
            const todoList = get(TodoListState())
            const newTodoList = todoList.filter((todo) => todo.id !== id)
            return SetTodoListCommand(newTodoList)
          },
        })

        const ClearAllCompletedCommand = domain.command({
          name: 'ClearAllCompletedCommand',
          impl: ({ get }) => {
            const todoList = get(TodoListState())
            const newTodoList = todoList.filter((todo) => !todo.completed)
            return SetTodoListCommand(newTodoList)
          },
        })

        const TodoListHistoryModule = HistoryModule(domain, {
          name: 'TodoListHistoryModule',
          query: ({ get }) => {
            return get(TodoListQuery())
          },
          command: ({}, todoList) => {
            return SetTodoListCommand(todoList)
          },
        })

        return {
          query: {
            ...TodoListHistoryModule.query,
            TodoListQuery,
          },
          command: {
            ...TodoListHistoryModule.command,
            SetTodoListCommand,
            AddTodoCommand,
            RemoveTodoTodoCommand,
            ClearAllCompletedCommand,
          },
          event: {
            ...TodoListHistoryModule.event,
          },
        }
      },
    })

    const store = Remesh.store()
    const domain = store.getDomain(TestHistoryDomain())

    store.igniteDomain(TestHistoryDomain())

    expect(store.query(domain.query.TodoListQuery())).toEqual([])
    expect(store.query(domain.query.HistoryListQuery())).toEqual([[]])

    expect(store.query(domain.query.CanBackQuery())).toEqual(false)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(false)

    const onBack = jest.fn()
    const onForward = jest.fn()
    const onGo = jest.fn()

    store.subscribeEvent(domain.event.BackEvent, onBack)
    store.subscribeEvent(domain.event.ForwardEvent, onForward)
    store.subscribeEvent(domain.event.GoEvent, onGo)

    store.send(
      domain.command.AddTodoCommand({
        id: 0,
        content: 'todo-0',
        completed: true,
      }),
    )

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 0,
        content: 'todo-0',
        completed: true,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(false)
    expect(onBack).toBeCalledTimes(0)
    expect(onForward).toBeCalledTimes(0)
    expect(onGo).toBeCalledTimes(0)

    store.send(
      domain.command.AddTodoCommand({
        id: 1,
        content: 'todo-1',
        completed: false,
      }),
    )

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 0,
        content: 'todo-0',
        completed: true,
      },
      {
        id: 1,
        content: 'todo-1',
        completed: false,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(false)
    expect(onBack).toBeCalledTimes(0)
    expect(onForward).toBeCalledTimes(0)
    expect(onGo).toBeCalledTimes(0)

    store.send(domain.command.BackCommand())

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 0,
        content: 'todo-0',
        completed: true,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(true)
    expect(onBack).toBeCalledTimes(1)
    expect(onForward).toBeCalledTimes(0)
    expect(onGo).toBeCalledTimes(1)

    store.send(domain.command.BackCommand())

    expect(store.query(domain.query.TodoListQuery())).toEqual([])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(false)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(true)
    expect(onBack).toBeCalledTimes(2)
    expect(onForward).toBeCalledTimes(0)
    expect(onGo).toBeCalledTimes(2)

    store.send(domain.command.BackCommand())

    expect(store.query(domain.query.TodoListQuery())).toEqual([])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(false)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(true)
    expect(onBack).toBeCalledTimes(2)
    expect(onForward).toBeCalledTimes(0)
    expect(onGo).toBeCalledTimes(2)

    store.send(domain.command.ForwardCommand())

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 0,
        content: 'todo-0',
        completed: true,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(true)
    expect(onBack).toBeCalledTimes(2)
    expect(onForward).toBeCalledTimes(1)
    expect(onGo).toBeCalledTimes(3)

    store.send(domain.command.ForwardCommand())

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 0,
        content: 'todo-0',
        completed: true,
      },
      {
        id: 1,
        content: 'todo-1',
        completed: false,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(false)
    expect(onBack).toBeCalledTimes(2)
    expect(onForward).toBeCalledTimes(2)
    expect(onGo).toBeCalledTimes(4)

    store.send(domain.command.GoCommand(-2))

    expect(store.query(domain.query.TodoListQuery())).toEqual([])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
      ],
      [
        {
          id: 0,
          content: 'todo-0',
          completed: true,
        },
        {
          id: 1,
          content: 'todo-1',
          completed: false,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(false)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(true)
    expect(onBack).toBeCalledTimes(3)
    expect(onForward).toBeCalledTimes(2)
    expect(onGo).toBeCalledTimes(5)

    store.send(
      domain.command.AddTodoCommand({
        id: 2,
        content: 'todo-2',
        completed: true,
      }),
    )

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 2,
        content: 'todo-2',
        completed: true,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([
      [],
      [
        {
          id: 2,
          content: 'todo-2',
          completed: true,
        },
      ],
    ])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(false)
    expect(onBack).toBeCalledTimes(3)
    expect(onForward).toBeCalledTimes(2)
    expect(onGo).toBeCalledTimes(5)

    store.send(domain.command.ReplaceCommand([]))

    expect(store.query(domain.query.TodoListQuery())).toEqual([
      {
        id: 2,
        content: 'todo-2',
        completed: true,
      },
    ])

    expect(store.query(domain.query.HistoryListQuery())).toEqual([[], []])

    expect(store.query(domain.query.CanBackQuery())).toEqual(true)
    expect(store.query(domain.query.CanForwardQuery())).toEqual(false)
    expect(onBack).toBeCalledTimes(3)
    expect(onForward).toBeCalledTimes(2)
    expect(onGo).toBeCalledTimes(5)
  })
})
