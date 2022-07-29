import { Remesh, RemeshStore } from '../src'
import { AsyncModule, AsyncData } from '../src/modules/async'
import { ListModule } from '../src/modules/list'
import { SwitchModule } from '../src/modules/switch'
import { TextModule } from '../src/modules/text'

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
    let load: (arg: string, arg1: number) => Promise<number> = async () => 0

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
          load: ({ get }, arg: number) => {
            return load(get(ArgState()), arg)
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

    load = (arg, arg1) => {
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

    store.send(domain.command.AddItemCommand({ id: 2, text: 'todo2-duplicated', completed: false }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 0, text: 'todo0', completed: false },
      { id: 1, text: 'todo1', completed: false },
      { id: 2, text: 'todo2', completed: false },
    ])

    store.send(domain.command.DeleteItemCommand('0'))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1', completed: false },
      { id: 2, text: 'todo2', completed: false },
    ])

    store.send(domain.command.UpdateItemCommand({ id: 1, text: 'todo1-updated', completed: true }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2', completed: false },
    ])

    store.send(domain.command.UpdateItemCommand({ id: 2, text: 'todo2-updated', completed: true }))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2-updated', completed: true },
    ])

    store.send(
      domain.command.AddItemListCommand([
        { id: 3, text: 'todo3', completed: false },
        { id: 3, text: 'todo3-duplicated', completed: false },
        { id: 4, text: 'todo4', completed: false },
      ]),
    )

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2-updated', completed: true },
      { id: 3, text: 'todo3', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    store.send(domain.command.AddItemListCommand([]))

    expect(store.query(domain.query.ItemListQuery())).toEqual([
      { id: 1, text: 'todo1-updated', completed: true },
      { id: 2, text: 'todo2-updated', completed: true },
      { id: 3, text: 'todo3', completed: false },
      { id: 4, text: 'todo4', completed: false },
    ])

    store.send(domain.command.DeleteItemListCommand(['1', '2']))

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
  })

  it('text-module', () => {
    const TestDomain = Remesh.domain({
      name: 'TestDomain',
      impl: (domain) => {
        const TestTextModule = TextModule(domain, {
          name: 'TestTextModule',
          default: 'default',
        })

        return TestTextModule
      },
    })

    const domain = store.getDomain(TestDomain())

    expect(store.query(domain.query.TextQuery())).toEqual('default')

    store.send(domain.command.SetTextCommand('text'))

    expect(store.query(domain.query.TextQuery())).toEqual('text')

    store.send(domain.command.ResetCommand())

    expect(store.query(domain.query.TextQuery())).toEqual('default')

    store.send(domain.command.ClearTextCommand())

    expect(store.query(domain.query.TextQuery())).toEqual('')
  })

  it('switch-module', () => {
    const TestDomain = Remesh.domain({
      name: 'TestDomain',
      impl: (domain) => {
        const TestSwitchModule = SwitchModule(domain, {
          name: 'TestSwitchModule',
          default: false,
        })

        return TestSwitchModule
      },
    })

    const domain = store.getDomain(TestDomain())

    expect(store.query(domain.query.SwitchQuery())).toEqual(false)

    store.send(domain.command.SwitchCommand(true))

    expect(store.query(domain.query.SwitchQuery())).toEqual(true)

    store.send(domain.command.ResetCommand())

    expect(store.query(domain.query.SwitchQuery())).toEqual(false)
  })
})
