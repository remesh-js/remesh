# 示例指南

- [如何定义一个 domain?](#如何定义一个-domain)
- [如何定义一个 state?](#如何定义一个-state)
- [如何定义一个 command?](#如何定义一个-command)
- [如何从一个 command 中读取 state?](#如何从一个-command-中读取-state)
- [如何定义一个 query?](#如何更新-state)
- [如何更新 state?](#如何定义一个-query)
- [如何定义一个 event?](#如何定义一个-event)
- [如何在 command 中 emit 一个 event?](#如何在-command-中-emit-一个-event)
- [如何更新多个 states?](#如何更新多个-states)
- [如何在 command-不做任何变更?](#如何在-command-不做任何变更)
- [如何传递参数给 domain query?](#如何传递参数给-domain-query)
- [如何传递参数给 domain command?](#如何传递参数给-domain-command)
- [如何定义一个 effect?](#如何定义一个-effect)
- [如何定义一个 defer state?](#如何定义一个-defer-state)
- [如何在 react component 中使用 domain?](#如何在-react-component-中使用-domain)
- [如何将 remesh store 传递给 react component?](#如何将-remesh-store-传递给-react-component)
- [如何挂载 logger?](#如何挂载-logger)
- [如何连接到 redux-devtools?](#如何连接到-redux-devtools)
- [如何在 domain 中拉取异步资源?](#如何在-domain-中拉取异步资源)
- [如何在 domain 中管理一个 list?](#如何在-domain-中管理一个-list)
- [如何定义一个 custom module 以跨 domains 重用 logic?](#如何定义一个-custom-module-以跨-domains-重用-logic)
- [如何访问其它 domains?](#如何访问其它-domains)
- [如何释放其它 Doamins?](#如何释放其它-doamins)
- [如何在 domain-effect 中订阅 events 或 queries 或 commands?](#如何在-domain-effect-中订阅-events-或-queries-或-commands)
- [如何创建和直接使用 remesh store?](#如何创建和直接使用-remesh-store)
- [如何一次性发送多个 command？](#如何一次性发送多个-command)
- [如何在 command 之前或之后执行？](#如何在-command-之前或之后执行)
- [如何在 query 值变化后执行？](#如何在-query-值变化后执行)
- [如何在事件触发后执行？](#如何在事件触发后执行)
- [如何 time-travel 或 redo/undo?](#如何-time-travel-或-redo/undo)
- [如何规避 interface 引起的类型错误？](#如何规避-interface-引起的类型错误)
- [如何在 remesh 中使用 yjs 做状态同步？](#如何在-remesh-中使用-yjs-做状态同步)
- [如何在 React 应用中管理 remesh domain 的生存范围？](#如何在-React-应用中管理-remesh-domain-的生存范围)
- [如何注入依赖到 remesh domain 中？](#如何注入依赖到-remesh-domain-中)
- [如何让 remesh domain 支持 Server-side rendering?](#如何让-remesh-domain-支持-Server-side-rendering)
- [如何获取 Domain 的返回值类型?](#如何获取-Domain-的返回值类型)

## 如何定义一个 domain?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    // define your domain's related resources
  },
})
```

## 如何定义一个 state?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourState = domain.state({
      name: 'YourState',
      default: 0,
    })
  },
})
```

## 如何定义一个 command?

特别的, 如果一个 command 返回 `null` 或空数组 `[]`, 则表示该 command 不会更新 state 和触发 event.

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({ get }) => {
        // do something
      },
    })
  },
})
```

## 如何从一个 command 中读取 state?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourState = domain.state({
      name: 'YourState',
      default: 0,
    })

    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({ get }, ...args) => {
        const state = get(YourState())
      },
    })
  },
})
```

## 如何更新 state?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourState = domain.state({
      name: 'YourState',
      default: 0,
    })

    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({ get }, ...args) => {
        return YourState().new(get(YourState()) + 1)
      },
    })
  },
})
```

## 如何定义一个 query?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourQuery = domain.query({
      name: 'YourQuery',
      impl: ({ get }) => {
        // do something
      },
    })
  },
})
```

## 如何定义一个 event?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourEvent = domain.event({
      name: 'YourEvent',
    })
  },
})
```

## 如何在 command 中 emit 一个 event?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourEvent = domain.event<number>({
      name: 'YourEvent',
    })

    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({ get }) => {
        // just return an event in command
        return YourEvent(42)
      },
    })
  },
})
```

## 如何更新多个 states?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const AState = domain.state({
      name: 'AState',
      default: 0,
    })

    const BState = domain.state({
      name: 'BState',
      default: 0,
    })

    const CEvent = domain.event<number>({
      name: 'CEvent',
    })

    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({ get }) => {
        // return a list
        return [AState().new(get(AState()) + 1), BState().new(get(BState()) + 1), CEvent(42)]
      },
    })
  },
})
```

## 如何在 command 不做任何变更?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: () => {
        return null
        // or return []
      },
    })
  },
})
```

## 如何传递参数给 domain query?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourQuery = domain.query({
      name: 'YourQuery',
      impl: ({ get }, arg: number) => {
        // do something
      },
    })
  },
})
```

## 如何传递参数给 domain command?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({ get }, arg: number) => {
        // do something
      },
    })
  },
})
```

## 如何定义一个 effect?

```typescript
import { Remesh } from 'remesh'

// import rxjs for domain effect management
import { interval } from 'rxjs'

import { map } from 'rxjs/operators'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourEffect = domain.effect({
      name: 'YourEffect',
      impl: ({ get }) => {
        // send command to downstream
        return interval().pipe(map(() => YourCommand()))
      },
    })
  },
})
```

## 如何定义一个 defer state?

```typescript
import { Remesh } from 'remesh'

type Todo = {
  id: number
  title: string
  completed: boolean
}

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourState = domain.state<Todo>({
      name: 'YourState',
      // 设置 defer = true
      defer: true,
    })
  },
})
```

## 如何在 react component 中使用 domain?

```sh
# via npm
npm install --save remesh-react

# via yarn
yarn add remesh-react
```

对于 `react v18`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RemeshRoot, useRemeshDomain, useRemeshQuery, useRemeshEvent, useRemeshSend } from 'remesh-react'

const YourComponent = () => {
  const send = useRemeshSend()
  const domain = useRemeshDomain(YourDomain())
  const data = useRemeshQuery(domain.query.YourQuery(queryArg))

  const handleClick = () => {
    send(domain.command.YourCommand(commandArg))
  }

  useRemeshEvent(domain.event.YourEvent, (event) => {
    // do something
  })

  return <></>
}

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <RemeshRoot>
    <YourComponent />
  </RemeshRoot>,
)
```

## 如何将 remesh store 传递给 react component?

```tsx
const root = ReactDOM.createRoot(document.getElementById('root'))

const store = Remesh.store()

root.render(
  <RemeshRoot store={store}>
    <YourComponent />
  </RemeshRoot>,
)
```

## 如何挂载 logger?

```sh
# via npm
npm install --save remesh-logger

# via yarn
yarn add remesh-logger
```

```tsx
import { RemeshLogger } from 'remesh-logger'

const store = Remesh.store({
  inspectors: [RemeshLogger()],
})

root.render(
  <RemeshRoot store={store}>
    <YourComponent />
  </RemeshRoot>,
)
```

## 如何连接到 redux-devtools?

```sh
# via npm
npm install --save remesh-redux-devtools

# via yarn
yarn add remesh-redux-devtools
```

```tsx
import { RemeshReduxDevtools } from 'remesh-redux-devtools'

const store = Remesh.store({
  inspectors: [RemeshReduxDevtools()],
})

root.render(
  <RemeshRoot store={store}>
    <YourComponent />
  </RemeshRoot>,
)
```

## 如何在 domain 中拉取异步资源?

```typescript
import { Remesh } from 'remesh'
import { AsyncModule } from 'remesh/modules/async'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourAsyncTask = AsyncModule(domain, {
      name: 'YourAsyncTask',
      load: async ({ get }, arg: number) => {
        const response = fetch('/path/to/api?arg=' + arg)
        const json = await response.json()
        return json
      },
      onSuccess: ({ get }, json, arg) => {
        return MySuccessCommand(json)
      },
      onFailed: ({ get }, error, arg) => {
        return MyFailedCommand(error.message)
      },
      onLoading: ({ get }, arg) => {
        return MyLoadingCommand()
      },
      onCanceled: ({ get }, arg) => {
        return MyCanceledCommand()
      },
      onChanged: ({ get }, asyncState, arg) => {
        return MyChangedCommand()
      },
    })

    return {
      command: {
        LoadCommand: YourAsyncTask.command.LoadCommand,
        CancelCommand: YourAsyncTask.command.CancelCommand,
        ReloadCommand: YourAsyncTask.command.ReloadCommand,
      },
      event: {
        SuccessEvent: YourAsyncTask.event.SuccessEvent,
        FailedEvent: YourAsyncTask.event.FailedEvent,
        LoadingEvent: YourAsyncTask.event.LoadingEvent,
        CanceledEvent: YourAsyncTask.event.CanceledEvent,
        ChangedEvent: YourAsyncTask.event.ChangedEvent,
      },
    }
  },
})
```

## 如何在 domain 中管理一个 list?

```typescript
import { Remesh } from 'remesh'
import { ListModule } from 'remesh/modules/list'

type Todo = {
  id: number
  title: string
  completed: boolean
}

const TodoListDomain = Remesh.domain({
  name: 'TodoListDomain',
  impl: (domain) => {
    const TodoList = ListModule(domain, {
      name: 'TodoList',
      key: (todo) => todo.id.toString(),
    })

    return {
      command: {
        AddItemCommand: TodoList.command.AddItemCommand,
        DeleteItemCommand: TodoList.command.DeleteItemCommand,
        UpdateItemCommand: TodoList.command.UpdateItemCommand,
        AddItemListCommand: TodoList.command.AddItemListCommand,
        DeleteItemListCommand: TodoList.command.DeleteItemListCommand,
        UpdateItemListCommand: TodoList.command.UpdateItemListCommand,
        InsertBeforeCommand: TodoList.command.InsertBeforeCommand,
        InsertAfterCommand: TodoList.command.InsertAfterCommand,
        InsertAtCommand: TodoList.command.InsertAtCommand,
      },
    }
  },
})
```

## 如何定义一个 custom module 以跨 domains 重用 logic?

```typescript
import { Remesh, RemeshDomainContext, Capitalize } from 'Remesh'

/**
 * Capitalize is a helper type to constraint the name should start with upper case.
 */
export type TextModuleOptions = {
  name: Capitalize
  default?: string
}

/**
 * TextModule is a module for text.
 * Receiving a domain as fixed argument, you can use it in any domain by passing domain as argument.
 * The second argument is your custom options.
 */
export const TextModule = (domain: RemeshDomainContext, options: TextModuleOptions) => {
  const TextState = domain.state({
    name: `${options.name}.TextState`,
    default: options.default ?? '',
  })

  const TextQuery = domain.query({
    name: `${options.name}.TextQuery`,
    impl: ({ get }) => get(TextState()),
  })

  const SetTextCommand = domain.command({
    name: `${options.name}.SetTextCommand`,
    impl: ({}, current: string) => {
      return TextState().new(current)
    },
  })

  const ClearTextCommand = domain.command({
    name: `${options.name}.ClearTextCommand`,
    impl: ({}) => {
      return TextState().new('')
    },
  })

  const ResetCommand = domain.command({
    name: `${options.name}.ResetCommand`,
    impl: ({}) => {
      return TextState().new(options.default ?? '')
    },
  })

  return Remesh.module({
    query: {
      TextQuery,
    },
    command: {
      SetTextCommand,
      ClearTextCommand,
      ResetCommand,
    },
  })
}
```

在任意 domains 中像下面这样使用你的自定义 remesh module:

```typescript
import { Remesh } from 'Remesh'

import { TextModule } from 'my-custom-module'

const MyDomain = Remesh.domain({
  name: 'MyDomain',
  impl: (domain) => {
    /**
     * Passing domain as fixed argument.
     */
    const Text = TextModule(domain, {
      name: 'Text',
      default: 'Hello, world!',
    })

    return {
      command: {
        SetTextCommand: Text.command.SetTextCommand,
        ClearTextCommand: Text.command.ClearTextCommand,
        ResetCommand: Text.command.ResetCommand,
      },
      event: {
        TextChangedEvent: Text.event.TextChangedEvent,
      },
    }
  },
})
```

## 如何访问其它 domains?

```typescript
import { Remesh } from 'Remesh'

const ADomain = Remesh.domain({
  name: 'ADomain',
  impl: (domain) => {
    return {
      query: {
        AQuery,
      }
      command: {
        ACommand,
      },
      event: {
        AEvent
      }
    }
  },
})

const BDomain = Remesh.domain({
  name: 'BDomain',
  impl: (domain) => {
    return {
      query: {
        BQuery,
      }
      command: {
        BCommand,
      },
      event: {
        BEvent
      }
    }
  },
})


const MainDomain = Remesh.domain({
  name: 'MainDomain',
  impl: (domain) => {
    /**
     * Accessing other domains via domain.getDomain(..)
    */
    const aDomain = domain.getDomain(ADomain())
    const bDomain = domain.getDomain(BDomain())

    return {
      query: {
        AQuery: aDomain.query.AQuery,
        BQuery: bDomain.query.BQuery,
      }
      command: {
        ACommand: aDomain.command.ACommand,
        BCommand: bDomain.command.BCommand,
      },
      event: {
        AEvent: aDomain.event.AEvent,
        BEvent: bDomain.event.BEvent,
      },
    }
  },
})
```

## 如何释放其它 Doamins?

用 `domain.getDomain` 可以访问其它 domains，但它同时也会储存这些 domains。

如果不再需要一个 domain，可以用 `domain.forgetDomain` 释放它。

```typescript
import { Remesh } from 'Remesh'

const MainDomain = Remesh.domain({
  name: 'MainDomain',
  impl: (domain) => {
    /**
     * Accessing other domains via domain.getDomain(..)
     */
    let aDomain = domain.getDomain(ADomain())

    /**
     * Forget other domains via domain.forgetDomain(..)
     */
    domain.forgetDomain(ADomain())
    aDomain = null

    return {}
  },
})
```

## 如何在 domain-effect 中订阅 events 或 queries?

```typescript
import { Remesh } from 'Remesh'

import { merge } from 'rxjs'
import { map } from 'rxjs/operators'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourQuery = domain.query({
      name: 'YourQuery',
      impl: ({ get }) => get(YourState()),
    })

    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: ({}, current: string) => {
        return YourState().new(current)
      },
    })

    const YourEvent = domain.event({
      name: 'YourEvent',
      impl: ({ get }) => get(YourState()),
    })

    domain.effect({
      name: 'YourEffect',
      impl: ({ get, fromEvent, fromQuery }) => {
        /**
         * Subscribe to events via fromEvent(..)
         * The observable it returned will emit next value when the event is emitted.
         */
        const event$ = fromEvent(YourEvent())
        /**
         * Subscribe to queries via fromQuery(..)
         * The observable it returned will emit next value when the query is re-computed.
         */
        const query$ = fromQuery(YourQuery())

        return merge(event$, query$).pipe(map(() => [ACommand(), BCommand()]))
      },
    })

    return {
      query: {
        YourQuery,
      },
      command: {
        YourCommand,
      },
      event: {
        YourEvent,
      },
    }
  },
})
```

## 如何创建和直接使用 remesh store?

```typescript
import { Remesh } from 'Remesh'

import YourDomain from 'your-domain'

/**
 * Create a remesh store.
 */
const store = Remesh.store()

/**
 * get domain from store.
 */
const yourDomain = store.getDomain(YourDomain())

/**
 * ignite domain for activating domain-effect if needed
 */
store.igniteDomain(YourDomain())

/**
 * subscribe the domain event
 */
 */
store.subscribeEvent(yourDomain.event.YourEvent, (event) => {
  console.log(event)
}

/**
  * subscribe the domain query
  */
store.subscribeQuery(yourDomain.query.YourQuery(), (queryResult) => {
  console.log(queryResult)
}


/**
 * send command to your domain
 */
store.send(yourDomain.command.YourCommand('Hello, world!'))


/**
 * Discard target domain resources
 */
store.discardDomain(YourDomain())

/**
 * discard all resource
 */
store.discard()
```

## 如何一次性发送多个 command？

```typescript
import { Remesh } from 'Remesh'

import YourDomain from 'your-domain'

const store = Remesh.store()

const yourDomain = store.getDomain(YourDomain())

// 打包成一个数组发送
store.send([yourDomain.command.YourACommand('Hello, ACommand!'), yourDomain.command.YourBCommand('Hello, BCommand!')])
```

## 如何在 command 之前或之后执行？

```typescript
const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const ACommand = domain.command({
      name: 'ACommand',
      impl: ({ get }, arg: number) => {
        // ...do something
      },
    })

    ACommand.before(({ get }, arg) => {
      // 在 ACommand 之前执行
      return BeforeACommand(arg)
    })

    ACommand.after(({ get }, arg) => {
      // 在 ACommand 之后执行
      return AfterACommand()
    })
  },
})
```

## 如何在 query 值变化后执行？

```typescript
const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const AQuery = domain.query({
      name: 'AQuery',
      impl: ({ get }) => {
        // ...do something
      },
    })

    AQuery.changed(({ get }, { current, previous }) => {
      // do something when the value of AQuery was changed
      return SomeCommand()
    })
  },
})
```

## 如何在事件触发后执行？

```typescript
const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const AEvent = domain.event({
      name: 'AEvent',
    })

    AEvent.emitted(({ get }, eventArg) => {
      // do something when event was emitted
    })
  },
})
```

## 如何 time-travel 或 redo/undo?

```typescript
// use history-module in remesh
import { HistoryModule } from 'remesh/modules/history'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const TodoAppHistoryModule = HistoryModule(domain, {
      name: 'TodoAppHistoryModule',
      // subscribe state via query
      query: ({ get }) => {
        return get(TodoAppStateQuery())
      },
      // sync state via command
      command: ({}, state) => {
        return UpdateTodoAppStateCommand(state)
      },
    })

    return {
      query: {
        // history list: T[]
        HistoryListQuery: TodoAppHistoryModule.query.HistoryListQuery,
        // can back: boolean
        CanBackQuery: HistoryListQuery.query.CanBackQuery,
        // can forward: boolean
        CanForwardQuery: HistoryListQuery.query.CanForwardQuery,
        // current index: number | null
        CurrentIndexQuery: HistoryListQuery.query.CurrentIndexQuery,
        // current state: T | null
        CurrentStateQuery: HistoryListQuery.query.CurrentStateQuery,
      },
      command: {
        // go(n), n can be negative, just like history.go(n)
        GoCommand: HistoryListQuery.command.GoCommand,
        // add state to history list
        AddCommand: HistoryListQuery.command.AddCommand,
        // set history list
        SetCommand: HistoryListQuery.command.SetCommand,
        // replace state
        ReplaceCommand: HistoryListQuery.command.ReplaceCommand,
        // back() if possible
        BackCommand: HistoryListQuery.command.BackCommand,
        // forward() if possible
        ForwardCommand: HistoryListQuery.command.ForwardCommand,
      },
      event: {
        // trigger when back
        BackEvent: HistoryListQuery.event.BackEvent,
        // trigger when forward
        ForwardEvent: HistoryListQuery.event.ForwardEvent,
        // trigger when go
        GoEvent: HistoryListQuery.event.GoEvent,
      },
    }
  },
})
```

## 如何规避 interface 引起的类型错误？

你可能在使用 remesh 过程中会遇到 interface 引起的类型错误。

```typescript
import { ToType } from 'Remesh'

import { MyInterface } from 'my-interface'

// 从 interface 中创建一个 type-alias
type MyType = ToType<MyInterface>
```

## 如何在 remesh 中使用 yjs 做状态同步？

用 [remesh-yjs](packages/remesh-yjs), 只要定义你的 `onSend` 和 `onReceive` 就行了。

```sh
npm install --save remesh-yjs
yarn add remesh-yjs
```

[click to see example](projects//react-demos/src/todo-mvc-with-multiple-domains/components/TodoApp.tsx)

```typescript
import { RemeshYjs } from 'remesh-yjs'

type SyncedState = {
  todos: Todo[]
  filter: TodoFilter
  input: string
}

const TodoAppDomain = Remesh.domain({
  name: 'TodoAppDomain',
  impl: (domain) => {
    const todoListDomain = domain.getDomain(TodoListDomain())
    const todoFilterDomain = domain.getDomain(TodoFilterDomain())
    const todoInputDomain = domain.getDomain(TodoInputDomain())

    const TodoFilterSyncEvent = domain.event<TodoFilter>({
      name: 'TodoFilterSyncEvent',
    })

    RemeshYjs(domain, {
      // 提供一个唯一的 key 给你需要同步的状态
      key: 'todo-app',
      // 提供你的状态的数据类型：object/array
      dataType: 'object',
      // 在 onSend 中提供你要同步给其他用户的状态
      onSend: ({ get }): SyncedState => {
        const todos = get(todoListDomain.query.TodoListQuery())
        const filter = get(todoFilterDomain.query.TodoFilterQuery())
        const input = get(todoInputDomain.query.TodoInputQuery())
        return {
          todos,
          filter,
          input,
        }
      },
      // 在 onReceive 中消费其他用户的 `onSend` 里的状态
      onReceive: ({ get }, state: SyncedState) => {
        const filter = get(todoFilterDomain.query.TodoFilterQuery())

        return [
          todoListDomain.command.SetTodoListCommand(state.todos),
          filter !== state.filter ? TodoFilterSyncEvent(state.filter) : null,
          todoInputDomain.command.SetTodoInputCommand(state.input),
        ]
      },
    })

    return {
      event: {
        TodoFilterSyncEvent,
      },
    }
  },
})
```

## 如何在 React 应用中管理 remesh domain 的生存范围？

remesh 默认会自动回收不再被订阅的 domain 资源，有时这是不符合预期的，我们可以通过 `RemeshScope` 组件，延长特定范围内的 domain 资源的活跃时间。

```tsx
import { RemeshScope } from 'remesh-react'

const App = (props) => {
  /**
   * 传入 domains 给 RemeshScope
   * 即便 A 组件被销毁，领域资源失去订阅者，它也不会被回收
   * 下一次 A 组件渲染时，可以获取到原来的状态
   */
  return <RemeshScope domains={[TestScopeDomain()]}>{props.show && <A />}</RemeshScope>
}
```

## 如何注入依赖到 remesh domain 中？

remesh 提供了从外部注入依赖到 remesh domain 中的 API——`Remesh.extern`

- `extern`：一组抽象的接口定义
- `extern-impl`: 满足 `extern` 接口的特定实现

具体用法如下：

```tsx
import { Remesh } from 'remesh'

export type Storage = {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T) => Promise<void>
  clear: (key: string) => Promise<void>
}

export const Storage = Remesh.extern<Storage | null>({
  name: 'StorageExtern',
  default: null,
})
```

在 remesh domain 中，像这样使用 `extern`：

```tsx
import { Remesh } from 'remesh'

const TestDomain = Remesh.domain({
  name: 'TestDomain',
  impl: (domain) => {
    const storage = domain.getExtern(Storage)

    if (!storage) {
      throw new Error(`Expected injected storage-impl, but got null`)
    }

    // do something
  },
})
```

注入 `extern-impl` 的方式如下：

```tsx
import { Remesh } from 'remesh'
import localforage from 'localforage'
import { Storage } from './domain-externs/storage'

export const StorageImpl = Storage.impl({
  get: (key) => {
    return localforage.getItem(key)
  },
  set: async (key, value) => {
    await localforage.setItem(key, value)
  },
  clear: (key) => {
    return localforage.removeItem(key)
  },
})

const store = Remesh.store({
  externs: [StorageImpl], // inject StorageImpl
})
```

在不同的环境中，可以注入不同的 `extern-impl`.

## 如何让 remesh domain 支持 Server-side rendering?

remesh 提供了支持服务端渲染的 API——`domain.preload`，用法如下所示：

```tsx
import { Remesh } from 'remesh'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export type State = {
  count: number
}

export const PreloadDomain = Remesh.domain({
  name: 'PreloadDomain',
  impl: (domain) => {
    const CountState = domain.state<State>({
      name: 'CountState',
      default: {
        count: 0,
      },
    })

    const CountQuery = domain.query({
      name: 'CountQuery',
      impl: ({ get }) => {
        return get(CountState())
      },
    })

    const SetCountCommand = domain.command({
      name: 'SetCountCommand',
      impl: ({}, newCount: number) => {
        return CountState().new({ count: newCount })
      },
    })

    const IncreCommand = domain.command({
      name: 'IncreCommand',
      impl: ({ get }) => {
        const state = get(CountState())
        return CountState().new({ count: state.count + 1 })
      },
    })

    const DecreCommand = domain.command({
      name: 'DecreCommand',
      impl: ({ get }) => {
        const state = get(CountState())
        return CountState().new({ count: state.count - 1 })
      },
    })

    // define how to fetch data via domain.preload
    domain.preload({
      key: 'preload_count',
      query: async () => {
        await delay(500)
        return {
          count: Math.floor(Math.random() * 100),
        }
      },
      command: ({}, data) => {
        return CountState().new({ count: data.count })
      },
    })

    return {
      query: {
        CountQuery,
      },
      command: {
        SetCountCommand: SetCountCommand,
        IncreCommand: IncreCommand,
        DecreCommand: DecreCommand,
      },
    }
  },
})
```

在支持 SSR 的框架中，像下面这样做（以 next.js 为例）：

```tsx
export type Props = {
  preloadedState: PreloadedState
}

export async function getServerSideProps(_context: NextPageContext) {
  // create remesh-store.
  const store = Remesh.store()

  // preload remesh domain
  await store.preload(PreloadDomain())

  // get preloaded state
  const preloadedState = store.getPreloadedState()

  return {
    props: {
      preloadedState: preloadedState,
    }, // will be passed to the page component as props
  }
}

export default (props: Props) => {
  return (
    <RemeshRoot
      options={{
        // pass preloaded state to RemeshRoot
        preloadedState: props.preloadedState,
      }}
    >
      <Counter />
    </RemeshRoot>
  )
}

// or pass to remesh-store' directly
const store = Remesh.store({
  preloadedState,
})
```

## 如何获取 Domain 的返回值类型?

```ts
import { Remesh, DomainTypeOf } from 'Remesh'

const ADomain = Remesh.domain({
  name: 'ADomain',
  impl: (domain) => {
    return {
      query: {
        AQuery,
      }
      command: {
        ACommand,
      },
      event: {
        AEvent
      }
    }
  },
})

// infer the return type of a domain
type ADomainType = DomainTypeOf<typeof ADomain>

ADomainType['query'] // { AQuery }
ADomainType['command'] // { ACommand }
```
