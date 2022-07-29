# remesh

<p align="center">
  <img width="400" src="./assets/Remesh-logos.jpeg">
</p>

[![npm version](https://img.shields.io/npm/v/remesh.svg?style=flat)](https://www.npmjs.com/package/remesh)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Lucifier129/remesh#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Lucifier129/remesh/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Lucifier129/remesh/blob/master/LICENSE)
[![Twitter: guyingjie129](https://img.shields.io/twitter/follow/guyingjie129.svg?style=social)](https://twitter.com/guyingjie129)

> A DDD framework for large and complex TypeScript/JavaScript applications

## Features

- DDD principles
- CQRS Architecture
- Event-driven Architecture
- Incremental updates
- Reactive programming
- Immutable state
- Type-friendly APIs
- Framework-agnostic(React/Vue supported officially)
- SSR support

## Concepts

A domain is like a component of your application. But not for the UIs, it's for your business logic.

All related things are encapsuled in the domain.

A domain can have as many resources listed in below as you want.

- **Domain States**: the state you want to store in the domain.
- **Domain Entities**: the entity you want to store in the domain. An entity must has a unique identifier as key.
- **Domain Events**: identify something happened in the domain.
- **Domain Commands**: update states/entities or emit events or do nothing.
- **Domain Queries**: query states/entities or deriving another query.
- **Domain Effects**: An observable that perform side-effect and send commands or events.

For any domains, only `domain-query`, `domain-command`, `domain-event` can be exposed to the outside.

`domain-state` and `domain-entity` are not exposed to the outside and can't be touched directly out of the domain.

For the consumers of any domains.

- The only way to read states or entities is through `domain-query` for preventing invalid read.

- The only way to update states or entities is through `domain-command` for preventing invalid update.

## Installation

```sh
# Install remesh via npm
npm install --save remesh
# Install remesh via yarn
yarn add remesh
```

## Usage

### define your domain

```typescript
import { Remesh } from 'remesh'

import { interval } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * Define your domain model
 */
const CountDomain = Remesh.domain({
  name: 'CountDomain',
  impl: (domain) => {
    /**
     * Define your domain's related events
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

    const IncreaseCountCommand = domain.command({
      name: 'IncreaseCountCommand',
      impl: ({ get }, count: number = 1) => {
        return SetCountCommand(get(CountState()) + count)
      },
    })

    /**
     * Define your domain's related effects
     */

    domain.effect({
      name: 'IncrementCountEffect',
      impl: () => {
        /**
         * Auto-increase count per seconds
         */
        return interval(1000).pipe(map(() => IncreaseCountCommand()))
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
      },
      event: {
        CountChangedEvent,
      },
    }
  },
})
```

### Using your domain in react component

```jsx
import React from 'react'

import ReactDOM from 'react-dom/client'

import { RemeshRoot, useRemeshDomain, useRemeshQuery, useRemeshSend, useRemeshEvent } from 'remesh-react'

import { CountDomain } from './CountDomain'

const Counter = () => {
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

  const handleClick = () => {
    /**
     * send command to domain
     */
    send(countDomain.command.IncreaseCountCommand())
  }

  /**
   * listen to the domain event via useRemeshEvent
   */
  useRemeshEvent(countDomain.event.CountEvent, (count) => {
    console.log(count)
  })

  return (
    <div id="container">
      <div id="count">{count}</div>
      <button onClick={handleClick}>Click me</button>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))

/**
 * <RemeshRoot /> is the root component of remesh-react
 */
root.render(
  <RemeshRoot>
    <Counter />
  </RemeshRoot>,
)
```

## Recipes

- [How to define a domain?](#how-to-define-a-domain)
- [How to define a state?](#how-to-define-a-state)
- [How to define a command?](#how-to-define-a-command)
- [How to read the state in command?](#how-to-read-the-state-in-command)
- [How to define a query?](#how-to-define-a-query)
- [How to update the state?](#how-to-update-the-state)
- [How to define an event?](#how-to-define-an-event)
- [How to emit an event in command?](#how-to-emit-an-event-in-command)
- [How to update multiple states?](#how-to-update-multiple-states)
- [How not to do anything in command?](#how-not-to-do-anything-in-command)
- [How to pass arg to domain query?](#how-to-pass-arg-to-domain-query)
- [How to pass arg to domain command?](#how-to-pass-arg-to-domain-command)
- [How to define an effect?](#how-to-define-an-effect)
- [How to define an entity?](#how-to-define-an-entity)
- [How to use domain in react component?](#how-to-use-domain-in-react-component)
- [How to pass a remesh store to react component?](#how-to-pass-a-remesh-store-to-react-component)
- [How to attach logger?](#how-to-attach-logger)
- [How to connect redux-devtools?](#how-to-connect-redux-devtools)

### How to define a domain?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    // define your domain's related resources
  },
})
```

### How to define a state?

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

### How to define a command?

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

### How to read the state in command?

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

### How to update the state?

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

### How to define a query?

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

### How to define an event?

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

### How to emit an event in command?

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

### How to update multiple states?

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

### How not to do anything in command?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const YourCommand = domain.command({
      name: 'YourCommand',
      impl: () => {
        return null
      },
    })
  },
})
```

### How to pass arg to domain query?

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

### How to pass arg to domain command?

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

### How to define an effect?

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

### How to define an entity?

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

### How to use domain in react component?

```sh
# via npm
npm install --save remesh-react

# via yarn
yarn add remesh-react
```

For `react v18`

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

### How to pass a remesh store to react component?

```tsx
const root = ReactDOM.createRoot(document.getElementById('root'))

const store = Remesh.store()

root.render(
  <RemeshRoot store={store}>
    <YourComponent />
  </RemeshRoot>,
)
```

### How to attach logger?

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

### How to connect redux-devtools?

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

## Packages

- remesh: the core package for define your domain
- remesh-react: the package for using remesh in react
- remesh-vue: the package for using remesh in vue
- remesh-logger: the package for logging
- remesh-redux-devtools: the package for redux-devtools

## Inspiration

- Domain-Driven-Design inspired the conceptual model
- CQRS/ES inspired the architecture model
- [Redux](https://github.com/reduxjs/redux) inspired the implementation of command model
- [Recoil](https://github.com/facebookexperimental/Recoil) inspired the implementation of query model
- [Rxjs](https://github.com/ReactiveX/rxjs) inspired the implementation of the event model

## Pull requests are welcome

```

```
