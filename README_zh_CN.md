# remesh

[English] | 中文

[English]:./README.md
[中文]:./README_zh_CN.md

<p align="center">
  <img width="400" src="./assets/Remesh-logos.jpeg">
</p>

[![npm version](https://img.shields.io/npm/v/remesh.svg?style=flat)](https://www.npmjs.com/package/remesh)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Lucifier129/remesh#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Lucifier129/remesh/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Lucifier129/remesh/blob/master/LICENSE)
[![Twitter: guyingjie129](https://img.shields.io/twitter/follow/guyingjie129.svg?style=social)](https://twitter.com/guyingjie129)

> Remesh, 基于 CQRS 的领域驱动设计框架, 为大型 TypeScript/JavasScript 应用而生.

## 特性

- DDD 原则
- CQRS 架构
- Event-driven 架构
- 增量更新
- 反应式编程
- 可变状态
- 类型友好的 APIs
- 框架无关(官方支持 React/Vue)
- 支持 SSR

## 为何选择 Remesh?

所以, 为什么是 Rememsh 呢? 它能为我的应用带来何种益处呢?

这取决于你是否被以下内容所吸引:

- **模块化**: 你不必将你的状态聚合到一起, 它可以原子化的方式被定义和处理, 并可以 `domain.query` 聚合为其它的派生状态.

- **高性能**: 如果没有订阅, 你的组件不会因 `domain.query` 的变化而重新渲染.

- **可维护性**: Remesh 提供了一组极具表达能力的 APIs, 鼓励你通过规范的编码方式, 维护业务逻辑, 如此提高代码的可维护性.

- **可组合性**: 无需仅为你的多个页面构建单一的 domain, 你可以按需定义多个 domain, 并且在一个 domain 中通过 `domain.getDomain(...)` 来访问其它 domains.

- **复用性**: 你可以编写 remesh 自定义模块以在多个 domains 中复用逻辑, 就像编写 react-hooks 那样.

- **可测试性**: 你的 Remesh code 是视图无关的, 因此你可以在测试环境下更简单地测试你的业务逻辑.

- **可预测性**: Remesh 帮助你将业务逻辑划分为 pure 和 effect 部分: pure 部分是纯函数和不可变数据, 它们安全且可预测, 并且构成了你业务逻辑的核心. effect 部分则通过 rxjs 以组合的方式管理副作用, 因此我们可以轻松的控制数据的流向.

- **可持续性**: 你的业务逻辑并不和你的视图层绑定, 即便你从一个视图库迁移到另一个 (比如从 react 到 vue), 你仍然可以重用所有的 remesh 代码, 并且无需重构或重写即可继续迭代.

## 概念

一个 domain 就像你的应用中的一个 component, 但它不关于 UI, 而是关于你的业务逻辑.

"所有相关的事物被封装到一起", 即为 domain.

一个 doamin 可以根据你的需求, 包含许多种资源, 如下:

- **Domain States**: 你希望存储在 domain 中的状态.
- **Domain Entities**: 你希望存储在 domain 中的实体. 一个实体必须有唯一的标识作为 key.
- **Domain Events**: 指明 domain 中会发生的某些事情.
- **Domain Commands**: 更新 states/entities, 或 emit events, 或什么都不做.
- **Domain Queries**: 查询 states/entities, 或者驱动另一个 query.
- **Domain Effects**: 一个可观察对象(observable), 用于执行副作用, 发送 commands 或者 events.

对于任意 domains 而言, 只有 `domain-query`, `domain-command`, `domain-event` 可以被暴露出去.

`domain-state` and `domain-entity` 不会被暴露出去, 也不能在 domain 以外被直接接触到.

对于 domains 的消费方而言.

- 唯一读取 states 或 entities 的方式, 是 `domain-query`, 以此阻止那些无效的读取.

- 唯一更新 states 或 entities 的方式, 是 `domain-command`, 以此阻止那些无效的更新.

## 安装

```sh
# Install remesh and rxjs via npm
npm install --save remesh rxjs
# Install remesh and rxjs via yarn
yarn add remesh rxjs
```

## 使用

你可以在 [stackblitz](https://stackblitz.com/edit/react-ts-gg1icr?file=domain.ts,index.tsx) 上编辑它.

### 定义你的 domain

```typescript
import { Remesh } from 'remesh'

import { interval } from 'rxjs'
import { map, switchMap, takeUntil } from 'rxjs/operators'

type ChangeMode = 'increment' | 'decrement'

/**
 * Define your domain model
 */
export const CountDomain = Remesh.domain({
  name: 'CountDomain',
  impl: (domain) => {
    /**
     * Define your domain's related states
     */
    const CountState = domain.state({
      name: 'CountState',
      default: 0,
    })

    /**
     * Define your domain's related events
     */
    const CountChangedEvent = domain.event<number>({
      name: 'CountChangedEvent',
    })

    /**
     * Define your domain's related commands
     */
    const SetCountCommand = domain.command({
      name: 'SetCountCommand',
      impl: ({}, count: number) => {
        /**
         * Update the domain's state and emit the related event
         */
        return [CountState().new(count), CountChangedEvent(count)]
      },
    })

    /**
     * Define your domain's related queries
     */
    const CountQuery = domain.query({
      name: 'CountQuery',
      impl: ({ get }) => {
        /**
         * Get the domain's state
         */
        return get(CountState())
      },
    })

    /**
     * You can use a command in another command
     */
    const IncreaseCountCommand = domain.command({
      name: 'IncreaseCountCommand',
      impl: ({ get }, count: number = 1) => {
        return SetCountCommand(get(CountState()) + count)
      },
    })

    /**
     * You can use a command in another command
     */
    const DecreaseCountCommand = domain.command({
      name: 'DecreaseCountCommand',
      impl: ({ get }, count: number = 1) => {
        return SetCountCommand(get(CountState()) - count)
      },
    })

    const ChangeCountByModeCommand = domain.command({
      name: 'ChangeCountByModeCommand',
      impl: ({}, mode: ChangeMode) => {
        if (mode === 'increment') return IncreaseCountCommand()
        if (mode === 'decrement') return DecreaseCountCommand()
        return null
      },
    })

    /**
     * Define an event for starting increment or decrement periodically
     */
    const StartEvent = domain.event<ChangeMode>({
      name: 'StartEvent',
    })

    /**
     * Define an event for stopping signal
     */
    const StopEvent = domain.event({
      name: 'StopEvent',
    })

    /**
     * Define your domain's related effects
     */

    domain.effect({
      name: 'ChangeCountEffect',
      impl: ({ fromEvent }) => {
        return fromEvent(StartEvent).pipe(
          switchMap((mode) => {
            return interval(100).pipe(
              map(() => ChangeCountByModeCommand(mode)),
              // finished when received stop event
              takeUntil(fromEvent(StopEvent)),
            )
          }),
        )
      },
    })

    /**
     * Expose domain resources
     */
    return {
      query: {
        CountQuery,
      },
      command: {
        SetCountCommand,
        IncreaseCountCommand,
        DecreaseCountCommand,
      },
      event: {
        StartEvent,
        StopEvent,
        /**
         * You can make an event subscribe-only for the consumers outside of domain
         */
        CountChangedEvent: CountChangedEvent.toSubscribeOnlyEvent(),
      },
    }
  },
})
```

### 在 React 组件中使用你的 domain

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import * as React from 'react'

import { RemeshRoot, useRemeshDomain, useRemeshQuery, useRemeshSend, useRemeshEvent } from 'remesh-react'

import { CountDomain } from './domain'

export const Counter = () => {
  /**
   * use remesh send for sending commands
   */
  const send = useRemeshSend()

  /**
   * read domain via useRemeshDomain
   */
  const countDomain = useRemeshDomain(CountDomain())

  /**
   * read domain query via useRemeshQuery
   */
  const count = useRemeshQuery(countDomain.query.CountQuery())

  const handleIncrement = () => {
    /**
     * send command to domain
     */
    send(countDomain.command.IncreaseCountCommand())
  }

  const handleDecrement = () => {
    /**
     * send command to domain
     */
    send(countDomain.command.DecreaseCountCommand())
  }

  const handleStartIncrease = () => {
    /**
     * send event to domain
     */
    send(countDomain.event.StartEvent('increment'))
  }

  const handleStartDecrease = () => {
    /**
     * send event to domain
     */
    send(countDomain.event.StartEvent('decrement'))
  }

  const handleStop = () => {
    /**
     * send event to domain
     */
    send(countDomain.event.StopEvent())
  }

  /**
   * listen to the domain event via useRemeshEvent
   */
  useRemeshEvent(countDomain.event.CountChangedEvent, (count) => {
    console.log(count)
  })

  return (
    <div id="container" style={{ textAlign: 'center', fontSize: 28 }}>
      <h1 id="count">{count}</h1>
      <button style={{ height: 40 }} onClick={handleStartIncrease}>
        start increase
      </button> <button style={{ height: 40 }} onClick={handleIncrement}>
        +1
      </button> <button style={{ height: 40 }} onClick={handleStop}>
        stop
      </button> <button style={{ height: 40 }} onClick={handleDecrement}>
        -1
      </button> <button style={{ height: 40 }} onClick={handleStartDecrease}>
        start decrease
      </button>{' '}
    </div>
  )
}

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <RemeshRoot>
      <Counter />
    </RemeshRoot>
  </StrictMode>,
)
```

## 示例

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
- [如何定义一个 entity?](#如何定义一个-entity)
- [如何在 react component 中使用 domain?](#如何在-react-component-中使用-domain)
- [如何将 remesh store 传递给 react component?](#如何将-remesh-store-传递给-react-component)
- [如何挂载 logger?](#如何挂载-logger)
- [如何连接到 redux-devtools?](#如何连接到-redux-devtools)
- [如何在 domain 中拉取异步资源?](#如何在-domain-中拉取异步资源)
- [如何在 domain 中管理一个 list?](#如何在-domain-中管理一个-list)
- [如何定义一个 custom module 以跨 domains 重用 logic?](#如何定义一个-custom-module-以跨-domains-重用-logic)
- [如何访问其它 domains?](#如何访问其它-domains)
- [如何在 domain-effect 中订阅 events 或 queries 或 commands?](#如何在-domain-effect-中订阅-events-或-queries-或-commands)
- [如何创建和直接使用 remesh store?](#如何创建和直接使用-remesh-store)

### 如何定义一个 domain?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    // define your domain's related resources
  },
})
```

### 如何定义一个 state?

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

### 如何定义一个 command?

特别的, 如果一个 command 返回 `null` 或空数组 `[]`, 则表示该 command 不会更新 state 或 entity，也不会触发 event.

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

### 如何从一个 command 中读取 state?

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

### 如何更新 state?

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

### 如何定义一个 query?

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

### 如何定义一个 event?

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

### 如何在 command 中 emit 一个 event?

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

### 如何更新多个 states?

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

### 如何在 command 不做任何变更?

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

### 如何传递参数给 domain query?

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

### 如何传递参数给 domain command?

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

### 如何定义一个 effect?

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

### 如何定义一个 entity?

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
    /**
     * Every entity should has a unique key
     */
    const YourEntity = domain.entity<Todo>({
      name: 'YourEntity',
      key: (todo) => todo.id.toString(),
    })
  },
})
```

### 如何在 react component 中使用 domain?

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

### 如何将 remesh store 传递给 react component?

```tsx
const root = ReactDOM.createRoot(document.getElementById('root'))

const store = Remesh.store()

root.render(
  <RemeshRoot store={store}>
    <YourComponent />
  </RemeshRoot>,
)
```

### 如何挂载 logger?

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

### 如何连接到 redux-devtools?

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

### 如何在 domain 中拉取异步资源?

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
      onSuccess: (json) => {
        return MySuccessCommand(json)
      },
      onFailed: (error) => {
        return MyFailedCommand(error.message)
      },
      onLoading: () => {
        return MyLoadingCommand()
      },
      onCanceled: () => {
        return MyCanceledCommand()
      },
      onChanged: () => {
        return MyChangedCommand()
      },
    })

    return {
      command: {
        LoadCommand: YourAsyncTask.command.LoadCommand,
        CanceledCommand: YourAsyncTask.command.CanceledCommand,
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

### 如何在 domain 中管理一个 list?

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

### 如何定义一个 custom module 以跨 domains 重用 logic?

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

### 如何访问其它 domains?

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
        AQuery: A.query.AQuery,
        BQuery: B.query.BQuery,
      }
      command: {
        ACommand: A.command.ACommand,
        BCommand: B.command.BCommand,
      },
      event: {
        AEvent: A.event.AEvent,
        BEvent: B.event.BEvent,
      },
    }
  },
})
```

### 如何在 domain-effect 中订阅 events 或 queries 或 commands?

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
      impl: ({ get, fromEvent, fromQuery, fromCommand }) => {
        /**
         * Subscribe to events via fromEvent(..)
         * The observable it returned will emit next value when the event is emitted.
         */
         */
        const event$ = fromEvent(YourEvent())
        /**
         * Subscribe to queries via fromQuery(..)
         * The observable it returned will emit next value when the query is re-computed.
         */
        const query$ = fromQuery(YourQuery())
        /**
         * Subscribe to commands via fromCommand(..)
         * The observable it returned will emit next value when the command is called.
         */
        const command$ = fromCommand(YourCommand)

        return merge(event$, query$, command$).pipe(map(() => [ACommand(), BCommand()]))
      }
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

### 如何创建和直接使用 remesh store?

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

## Packages

- [remesh](packages/remesh) : 定义你的 domain 的 core 包
- [remesh-react](packages/remesh-react) : 帮助在 react 中使用 remesh 的包
- [remesh-vue](packages/remesh-vue) : 帮助在 vue 中使用 remesh 的包
- [remesh-logger](packages/remesh-logger) : 打日志的包
- [remesh-redux-devtools](packages/remesh-redux-devtools) : 连接 redux-tools 的包

## 灵感来源

- Domain-Driven-Design 启发了 Remesh 的概念模型
- CQRS/ES 启发了架构模型
- [Redux](https://github.com/reduxjs/redux) 启发了 command 模型的实现
- [Recoil](https://github.com/facebookexperimental/Recoil) 启发了 query 模型的实现
- [Rxjs](https://github.com/ReactiveX/rxjs) 启发了 event 模型的实现

## 欢迎提交 Pull requests
