import { ListModule } from '../src/modules/list'
import { DomainTypeOf, RemeshDomain, RemeshStore } from '../src'
import * as utils from './utils'
import { Observable } from 'rxjs'

let store: ReturnType<typeof RemeshStore>
beforeEach(() => {
  store = RemeshStore({
    name: 'store',
  })
})

describe('domain', () => {
  it('basic - use RemeshDomain to define a domain', () => {
    const CounterDomain = RemeshDomain({
      name: 'CounterDomain',
      impl(domain) {
        const CountState = domain.state({
          name: 'CountState',
          default: 0,
        })

        const CountQuery = domain.query({
          name: 'CountQuery',
          impl: ({ get }) => {
            return get(CountState())
          },
        })

        const CountCommand = domain.command({
          name: 'CountCommand',
          impl: ({}, count: number) => {
            return [CountState().new(count), CountEvent(count)]
          },
        })

        const CountEvent = domain.event<number>({
          name: 'CountEvent',
        })

        return { query: { CountQuery }, command: { CountCommand }, event: { CountEvent } }
      },
    })

    const counter = store.getDomain(CounterDomain())

    const eventCallback = jest.fn()
    const queryCallback = jest.fn()

    store.subscribeEvent(counter.event.CountEvent, eventCallback)
    store.subscribeQuery(counter.query.CountQuery(), queryCallback)

    expect(store.query(counter.query.CountQuery())).toBe(0)

    store.send(counter.command.CountCommand(1))

    expect(store.query(counter.query.CountQuery())).toBe(1)
    expect(eventCallback).toHaveBeenCalledWith(1)
    expect(queryCallback).toHaveBeenCalledWith(1)

    store.send(counter.command.CountCommand(2))

    expect(store.query(counter.query.CountQuery())).toBe(2)
    expect(eventCallback).toHaveBeenCalledWith(2)
    expect(queryCallback).toHaveBeenCalledWith(2)
  })

  it('multi-domain with a store', () => {
    const BarDomain = RemeshDomain({
      name: 'BarDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: 'bar',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return get(ContentState())
          },
        })

        return { query: { ContentQuery } }
      },
    })

    const FooDomain = RemeshDomain({
      name: 'BarDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: 'foo',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return get(ContentState())
          },
        })

        return { query: { ContentQuery } }
      },
    })

    const barDomain = store.getDomain(BarDomain())
    const fooDomain = store.getDomain(FooDomain())

    expect(store.query(barDomain.query.ContentQuery())).toBe('bar')
    expect(store.query(fooDomain.query.ContentQuery())).toBe('foo')
  })

  it('use another domain in domain', async () => {
    const InputDomain = RemeshDomain({
      name: 'InputDomain',
      impl(domain) {
        const ContentState = domain.state({
          name: 'ContentState',
          default: 'ddd',
        })

        const ContentQuery = domain.query({
          name: 'ContentQuery',
          impl: ({ get }) => {
            return [get(ContentState()), { UpdateContentCommand }] as const
          },
        })

        const ContentChangeEvent = domain.event({
          name: 'ContentChangeEvent',
        })

        const UpdateContentCommand = domain.command({
          name: 'UpdateContentCommand',
          impl({}, newContent: string) {
            return [ContentState().new(newContent), ContentChangeEvent()]
          },
        })

        return {
          query: {
            ContentQuery,
          },
          event: {
            ContentChangeEvent,
          },
        }
      },
    })

    const ContentDomain = RemeshDomain({
      name: 'ContentDomain',
      impl(domain) {
        const inputDomain = domain.getDomain(InputDomain())

        const DisplayContentQuery = domain.query({
          name: 'DisplayContentQuery',
          impl({ get }) {
            const [content] = get(inputDomain.query.ContentQuery())
            return `content: ${content}`
          },
        })

        return {
          query: {
            ContentQuery: inputDomain.query.ContentQuery,
            DisplayContentQuery,
          },
          event: inputDomain.event,
        }
      },
    })

    const store = RemeshStore({
      name: 'store',
    })

    const contentDomain = store.getDomain(ContentDomain())

    await utils.delay(100)
    expect(store.query(contentDomain.query.DisplayContentQuery())).toBe('content: ddd')

    const changed = jest.fn()

    const [, commands] = store.query(contentDomain.query.ContentQuery())

    store.subscribeEvent(contentDomain.event.ContentChangeEvent, changed)
    store.send(commands.UpdateContentCommand('remesh'))

    expect(store.query(contentDomain.query.DisplayContentQuery())).toBe('content: remesh')
    expect(changed).toHaveBeenCalled()
  })

  it('support domain.forgetDomain', () => {
    const forget = jest.fn()
    type Todo = {
      id: number
      content: string
      completed: boolean
    }
    const TodoListDomain = RemeshDomain({
      name: 'TodoListDomain',
      impl: (domain, key: string) => {
        const TodoListModule = ListModule<Todo>(domain, {
          name: 'TodoListModule',
          key: (item) => item.id.toString(),
        })

        domain.effect({
          name: 'ForgetEffect',
          impl: () => {
            return new Observable(() => {
              return () => {
                forget(key)
              }
            })
          },
        })

        return {
          ...TodoListModule,
        }
      },
    })

    type TodoListDomainType = DomainTypeOf<typeof TodoListDomain>

    const AppDomain = RemeshDomain({
      name: 'AppDomain',
      impl: (domain) => {
        const TodoListDomainListModule = ListModule<{ key: string; todoListDomain: TodoListDomainType }>(domain, {
          name: 'TodoListDomainListModule',
          key: (item) => item.key,
          default: [],
        })

        const AppStateQuery = domain.query({
          name: 'AppStateQuery',
          impl: ({ get }) => {
            const todoListDomainList = get(TodoListDomainListModule.query.ItemListQuery())
            return todoListDomainList.map((item) => {
              return {
                key: item.key,
                todoList: get(item.todoListDomain.query.ItemListQuery()),
              }
            })
          },
        })

        const AddTodoListCommand = domain.command({
          name: 'AddTodoListCommand',
          impl: ({ get }, key: string) => {
            const todoListDomainList = get(TodoListDomainListModule.query.ItemListQuery())
            const target = todoListDomainList.find((item) => item.key === key)

            if (target) {
              return null
            }

            const todoListDomain = domain.getDomain(TodoListDomain(key))

            return TodoListDomainListModule.command.AddItemCommand({
              key,
              todoListDomain,
            })
          },
        })

        const DeleteTodoListCommand = domain.command({
          name: 'AddTodoListCommand',
          impl: ({ get }, key: string) => {
            const todoListDomainList = get(TodoListDomainListModule.query.ItemListQuery())
            const target = todoListDomainList.find((item) => item.key === key)

            if (target) {
              domain.forgetDomain(TodoListDomain(key))
              return TodoListDomainListModule.command.DeleteItemCommand(key)
            }

            return null
          },
        })

        const AddItemCommand = domain.command({
          name: 'AddItemCommand',
          impl: ({ get }, { key, item }: { key: String; item: Todo }) => {
            const todoListDomainList = get(TodoListDomainListModule.query.ItemListQuery())
            const target = todoListDomainList.find((item) => item.key === key)

            if (target) {
              return target.todoListDomain.command.AddItemCommand(item)
            }

            return null
          },
        })

        const DeleteItemCommand = domain.command({
          name: 'DeleteItemCommand',
          impl: ({ get }, { key, id }: { key: String; id: number }) => {
            const todoListDomainList = get(TodoListDomainListModule.query.ItemListQuery())
            const target = todoListDomainList.find((item) => item.key === key)

            if (target) {
              return target.todoListDomain.command.DeleteItemCommand(id.toString())
            }

            return null
          },
        })

        return {
          query: {
            AppStateQuery,
          },
          command: {
            AddItemCommand,
            DeleteItemCommand,
            AddTodoListCommand,
            DeleteTodoListCommand,
          },
        }
      },
    })

    const store = RemeshStore()
    const appDomain = store.getDomain(AppDomain())

    store.igniteDomain(AppDomain())

    expect(store.query(appDomain.query.AppStateQuery())).toEqual([])

    store.send(appDomain.command.AddTodoListCommand('todo-list-0'))

    expect(forget).toHaveBeenCalledTimes(0)
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([
      {
        key: 'todo-list-0',
        todoList: [],
      },
    ])

    store.send(appDomain.command.AddTodoListCommand('todo-list-1'))

    expect(forget).toHaveBeenCalledTimes(0)
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([
      {
        key: 'todo-list-0',
        todoList: [],
      },
      {
        key: 'todo-list-1',
        todoList: [],
      },
    ])

    store.send(
      appDomain.command.AddItemCommand({
        key: 'todo-list-1',
        item: {
          id: 0,
          content: 'content0',
          completed: true,
        },
      }),
    )

    expect(forget).toHaveBeenCalledTimes(0)
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([
      {
        key: 'todo-list-0',
        todoList: [],
      },
      {
        key: 'todo-list-1',
        todoList: [
          {
            id: 0,
            content: 'content0',
            completed: true,
          },
        ],
      },
    ])

    store.send(
      appDomain.command.AddItemCommand({
        key: 'todo-list-0',
        item: {
          id: 1,
          content: 'content1',
          completed: false,
        },
      }),
    )

    expect(forget).toHaveBeenCalledTimes(0)
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([
      {
        key: 'todo-list-0',
        todoList: [
          {
            id: 1,
            content: 'content1',
            completed: false,
          },
        ],
      },
      {
        key: 'todo-list-1',
        todoList: [
          {
            id: 0,
            content: 'content0',
            completed: true,
          },
        ],
      },
    ])

    store.send(
      appDomain.command.DeleteItemCommand({
        key: 'todo-list-0',
        id: 1,
      }),
    )

    expect(forget).toHaveBeenCalledTimes(0)
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([
      {
        key: 'todo-list-0',
        todoList: [],
      },
      {
        key: 'todo-list-1',
        todoList: [
          {
            id: 0,
            content: 'content0',
            completed: true,
          },
        ],
      },
    ])

    store.send(appDomain.command.DeleteTodoListCommand('todo-list-0'))

    expect(forget).toHaveBeenCalledWith('todo-list-0')
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([
      {
        key: 'todo-list-1',
        todoList: [
          {
            id: 0,
            content: 'content0',
            completed: true,
          },
        ],
      },
    ])

    store.send(appDomain.command.DeleteTodoListCommand('todo-list-1'))

    expect(forget).toHaveBeenCalledWith('todo-list-1')
    expect(store.query(appDomain.query.AppStateQuery())).toEqual([])
  })
})
