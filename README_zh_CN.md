# remesh

[English] | 中文

[english]: ./README.md
[中文]: ./README_zh_CN.md

<p align="center">
  <img width="400" src="./assets/Remesh-logos.jpeg">
</p>

[![npm version](https://img.shields.io/npm/v/remesh.svg?style=flat)](https://www.npmjs.com/package/remesh)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Lucifier129/remesh#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Lucifier129/remesh/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Lucifier129/remesh/blob/master/LICENSE)
[![Twitter: guyingjie129](https://img.shields.io/twitter/follow/guyingjie129.svg?style=social)](https://twitter.com/guyingjie129)

> Remesh, 基于 CQRS 的领域驱动设计框架, 为大型 TypeScript/JavasScript 应用而生.

- [示例指南](./docs/how-to-guide_zh_CN.md)

## 特性

- DDD 原则
- CQRS 架构
- Event-driven 架构
- 增量更新
- 反应式编程
- 不可变状态
- 类型友好的 APIs
- 框架无关(官方支持 React/Vue)
- 支持 SSR
- 支持多人协作(提供官方 yjs 集成)
- 支持时间旅行/Undo/Redo（借助`remesh/modules/history`）

## 为何选择 Remesh?

所以, 为什么是 Remesh 呢? 它能为我的应用带来何种益处呢?

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

一个 domain 可以根据你的需求, 包含许多种资源, 如下:

- **Domain States**: 你希望存储在 domain 中的状态.
- **Domain Queries**: 查询 states, 或者驱动另一个 query.
- **Domain Commands**: 更新 states, 或 emit events, 或什么都不做.
- **Domain Effects**: 一个可观察对象(observable), 用于执行副作用, 发送 commands 或者 events.

- **Domain Events**: 指明 domain 中会发生的某些事情.

对于任意 domain 而言, 只有 `domain-query`, `domain-command`, `domain-event` 可以被暴露出去.

`domain-state` 既不会被暴露出去, 也不能在 domain 以外被直接接触到.

对于 domains 的消费方而言.

- 唯一读取 states 的方式, 是 `domain-query`, 以此阻止那些无效的读取.

- 唯一更新 states 的方式, 是 `domain-command`, 以此阻止那些无效的更新.

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
// domain.ts
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
     * Define a command to send event since event can't be sended outside of domain
     */
    const StartCommand = domain.command({
      name: 'StartCommand',
      impl: ({}, mode: ChangeMode) => {
        return StartEvent(mode)
      },
    })

    /**
     * Define an event for stopping signal
     */
    const StopEvent = domain.event({
      name: 'StopEvent',
    })

    /**
     * Define a command to send event since event can't be sended outside of domain
     */
    const StopCommand = domain.command({
      name: 'StopCommand',
      impl: () => {
        return StopEvent()
      },
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
        StartCommand,
        StopCommand,
      },
      event: {
        StartEvent,
        StopEvent,
        CountChangedEvent,
      },
    }
  },
})
```

### 在 React 组件中使用你的 domain

```jsx
// index.tsx
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
     * send command to domain
     */
    send(countDomain.command.StartCommand('increment'))
  }

  const handleStartDecrease = () => {
    /**
     * send command to domain
     */
    send(countDomain.command.StartCommand('decrement'))
  }

  const handleStop = () => {
    /**
     * send command to domain
     */
    send(countDomain.command.StopCommand())
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

## FAQ

### 如何禁用 remesh 的 esm 模块输出？

remesh v4.0 开始支持了 esm 模块输出，在现阶段可能会引起你的项目里 esm/cjs 相互依赖导致的错误。解决方式是通过 bundler 配置，关闭 esm 模块或者映射为相应的 cjs 模块。

比如，在 webpack 中，可以通过 [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) 配置别名：

- `cjs-only`: 将 `remesh` 映射到 `remesh/cjs` ，将 `remesh-*` 映射到 `remesh-*/cjs`
- `esm-only`: 将 `remesh` 映射到 `remesh/esm` ，将 `remesh-*` 映射到 `remesh-*/esm`。

vite 中亦有类似的配置 [resolve.alias](https://vitejs.dev/config/shared-options.html#resolve-alias)

## 欢迎提交 Pull requests
