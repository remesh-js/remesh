# remesh

English | [中文]

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

> A CQRS-based DDD framework for large and complex TypeScript/JavaScript applications

- [How-to Guide](./docs/how-to-guide.md)

## Features

- DDD principles
- CQRS Architecture
- Event-driven Architecture
- Incremental updates
- Reactive programming
- Immutable state
- Type-friendly APIs
- Framework-agnostic(officially supports React/Vue)
- SSR support
- Collaboration support(provides official yjs integration)
- Time-Travel/Undo/Redo supports(via `remesh/modules/history`)

## Why Remesh?

So, why Remesh? What benefits can it bring to my application?

It depends on whether you will be attracted to the following.

- **Modularity**: You don't have to bring all your state together, it can be defined and processed atomically, and aggregated into other derived state with `domain.query`.

- **High performance**: Your component will not be re-rendered by the change of the `domain.query` it doesn't subscribe to.

- **Maintainability**: Remesh provides a set of expressive APIs to maintain your business logic with a uniform code style, enhancing code maintainability.

- **Composability**: There is no needed for your pages to have just one domain, you can define as many domains as you need and simply access other domains via `domain.getDomain(...)`. Build your application's business logic in a combinatorial way.

- **Reusability**: You can write remesh custom modules like react-hooks to reuse logic across multiple domains.

- **Testability**: Your Remesh code is view-independent, so you can test your business logic in a test environment more easily.

- **Predictability**: Remesh divides your business logic into pure and effect parts, where the pure parts are pure functions and immutable data, which are safe and predictable and form the core of your business logic. The effect part manages side effects in a combinatorial way through rxjs, so we can easily control the flow of data.

- **Sustainability**: Your business logic doesn't tie to the view layer, even if you migrate from one view library to another (e.g. from react to vue), you can still reuse all the remesh code and keep iterating without refactoring or rewriting.

## Concepts

A domain is like a component of your application. But not for the UIs, it's for your business logic.

All related things are encapsuled in the domain.

A domain can have as many resources listed in below as you want.

- **Domain States**: the state you want to store in the domain.
- **Domain Queries**: query states or deriving another query.
- **Domain Commands**: update states or emit events or do nothing.
- **Domain Effects**: An observable that perform side-effect and send commands or events.
- **Domain Events**: identify something happened in the domain.

For any domain, only `domain-query`, `domain-command`, `domain-event` can be exposed to the outside.

`domain-state` will not be exposed to the outside and can't be touched directly out of the domain.

For the consumers of any domain.

- The only way to read state is through `domain-query` for preventing invalid read.

- The only way to update state is through `domain-command` for preventing invalid update.

## Installation

```sh
# Install remesh and rxjs via npm
npm install --save remesh rxjs
# Install remesh and rxjs via yarn
yarn add remesh rxjs
```

## Usage

You can edit it in [stackblitz](https://stackblitz.com/edit/react-ts-gg1icr?file=domain.ts,index.tsx)

### Define your domain

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

### Using your domain in react component

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

## Packages

- [remesh](packages/remesh) : the core package for define your domain
- [remesh-react](packages/remesh-react) : the package for using remesh in react
- [remesh-vue](packages/remesh-vue) : the package for using remesh in vue
- [remesh-yjs](packages/remesh-yjs) : the package for using yjs in remesh
- [remesh-logger](packages/remesh-logger) : the package for logging
- [remesh-redux-devtools](packages/remesh-redux-devtools) : the package for redux-devtools

## Inspiration

- Domain-Driven-Design inspired the conceptual model
- CQRS/ES inspired the architecture model
- [Redux](https://github.com/reduxjs/redux) inspired the implementation of command model
- [Recoil](https://github.com/facebookexperimental/Recoil) inspired the implementation of query model
- [Rxjs](https://github.com/ReactiveX/rxjs) inspired the implementation of the event model

## FAQ

### How do I disable the esm module output of remesh?

**note: from remesh v4.2, esm is not the default, cjs-first now. You still can import remesh/esm to access esm**

remesh v4.0 starts to support esm module output, which may cause errors in your project due to esm/cjs dependencies for now. The solution is to disable the esm module or map it to the corresponding cjs module via bundler configuration.

For example, in webpack, you can configure aliases via [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) to

- `cjs-only`: maps `remesh` to `remesh/cjs` and `remesh-*` to `remesh-*/cjs`
- `esm-only`: maps `remesh` to `remesh/esm` and `remesh-*` to `remesh-*/esm`.

A similar configuration is available in vite [resolve.alias](https://vitejs.dev/config/shared-options.html#resolve-alias)

## Pull requests are welcome
