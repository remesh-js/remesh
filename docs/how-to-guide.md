# How-to Guide

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
- [How to define a defer state?](#How-to-define-a-defer-state)
- [How to use domain in react component?](#how-to-use-domain-in-react-component)
- [How to pass a remesh store to react component?](#how-to-pass-a-remesh-store-to-react-component)
- [How to attach logger?](#how-to-attach-logger)
- [How to connect redux-devtools?](#how-to-connect-redux-devtools)
- [How to fetch async resources in domain?](#how-to-fetch-async-resources-in-domain)
- [How to manage a list in domain?](#how-to-manage-a-list-in-domain)
- [How to define a custom module for reusing logic between domains?](#how-to-define-a-custom-module-for-reusing-logic-between-domains)
- [How to access other domains?](#how-to-access-other-domains)
- [How to forget other domains?](#how-to-forget-other-domains)
- [How to subscribe to events or queries or commands in domain-effect?](#how-to-subscribe-to-events-or-queries-or-commands-in-domain-effect)
- [How to create and use remesh store directly?](#how-to-create-and-use-remesh-store-directly)
- [How to send multiple commands or events at once?](#how-to-send-multiple-commands-or-events-at-once)
- [How to do something before or after a command?](#How-to-do-something-before-or-after-a-command)
- [How to do something when a query value was changed?](#How-to-do-something-when-a-query-value-was-changed)
- [How to do somehing when an event was emitted?](#How-to-do-somehing-when-an-event-was-emitted)
- [How to time-travel or redo/undo?](#How-to-time-travel-or-redo/undo)
- [How to avoid type error from interface?](#how-to-avoid-type-error-from-interface)
- [How to use yjs in remesh for collaboration?](#how-to-use-yjs-in-remesh-for-collaboration)
- [How do I manage the scope of the remesh domain in my React application?](#how-do-i-manage-the-scope-of-the-remesh-domain-in-my-React-application)
- [How to inject dependencies to remesh domain?](#How-to-inject-dependencies-to-remesh-domain)
- [How do I get the remesh domain to support server-side rendering?](#How-do-I-get-the-remesh-domain-to-support-server-side-rendering)
- [How to get the return type of a domain?](#How-to-get-the-return-type-of-a-domain)

## How-to define a domain?

```typescript
import { Remesh } from 'remesh'

const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    // define your domain's related resources
  },
})
```

## How to define a state?

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

## How to define a command?

Especially, it means no operations (no states update, and no events emit) to return `null` or empty array `[]` in command implementation.

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

## How to read the state in command?

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

## How to update the state?

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

## How to define a query?

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

## How to define an event?

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

## How to emit an event in command?

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

## How to update multiple states?

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

## How not to do anything in command?

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

## How to pass arg to domain query?

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

## How to pass arg to domain command?

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

## How to define an effect?

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

## How to define a defer state?

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
      // set defer = true
      defer: true,
    })
  },
})
```

## How to use domain in react component?

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

## How to pass a remesh store to react component?

```tsx
const root = ReactDOM.createRoot(document.getElementById('root'))

const store = Remesh.store()

root.render(
  <RemeshRoot store={store}>
    <YourComponent />
  </RemeshRoot>,
)
```

## How to attach logger?

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

## How to connect redux-devtools?

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

## How to fetch async resources in domain?

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

## How to manage a list in domain?

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

## How to define a custom module for reusing logic between domains?

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

Using your custom remesh module in any domains like below:

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

## How to access other domains?

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

## How to forget other domains?

The `domain.getDomain` function can be used to access other domains, but it will store those domains in memory.

If we no longer need a domain, we can use `domain.forgetDomain` to release it.

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

## How to subscribe to events or queries in domain-effect?

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
         */
        const event$ = fromEvent(YourEvent())
        /**
         * Subscribe to queries via fromQuery(..)
         * The observable it returned will emit next value when the query is re-computed.
         */
        const query$ = fromQuery(YourQuery())

        return merge(event$, query$).pipe(map(() => [ACommand(), BCommand()]))
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

## How to create and use remesh store directly?

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

## How to send multiple commands at once?

```typescript
import { Remesh } from 'Remesh'

import YourDomain from 'your-domain'

const store = Remesh.store()

const yourDomain = store.getDomain(YourDomain())

// bundle commands or events into one array
store.send([yourDomain.command.YourACommand('Hello, ACommand!'), yourDomain.command.YourBCommand('Hello, BCommand!')])
```

## How to do something before or after a command?

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
      // do something *before* ACommand called
      return BeforeACommand(arg)
    })

    ACommand.after(({ get }, arg) => {
      // do something *after* ACommand called
      return AfterACommand()
    })
  },
})
```

## How to do something when a query value was changed?

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

## How to do somehing when an event was emitted?

```typescript
const YourDomain = Remesh.domain({
  name: 'YourDomain',
  impl: (domain) => {
    const AEvent = domain.event({
      name: 'AEvent',
    })

    AQuery.emitted(({ get }, { current, previous }) => {
      // do something when event was emitted
      return SomeCommand()
    })
  },
})
```

## How to time-travel or redo/undo?

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

## How to avoid type error from interface?

You many hit type error from interface when using remesh.

```typescript
import { ToType } from 'Remesh'

import { MyInterface } from 'my-interface'

// create a type-alias from interface deeply.
type MyType = ToType<MyInterface>
```

## How to use yjs in remesh for collaboration?

use [remesh-yjs](packages/remesh-yjs), define your `onSend` and `onReceive`, that's all.

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
      // a unique key for your state to sync with others
      key: 'todo-app',
      // a data-type(object/array) for your state
      dataType: 'object',
      // provide your state in `onSend `
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
      // consume state from others `onSend` in your `onReceive`
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

## How do I manage the scope of the remesh domain in my React application?

remesh automatically reclaims domain resources that are no longer subscribed by default, which is sometimes not expected, and we can extend the active time of domain resources in a specific range with the `RemeshScope` component.

```tsx
import { RemeshScope } from 'remesh-react'

const App = (props) => {
  /**
   * Pass in domains to RemeshScope
   * Even if the A component is destroyed and the domain resource loses its subscribers, it will not be reclaimed
   * The next time the A component is rendered, the original state is available
   */
  return <RemeshScope domains={[TestScopeDomain()]}>{props.show && <A />}</RemeshScope>
}
```

## How to inject dependencies to remesh domain?

remesh provides an API for injecting dependencies from outside into the remesh domain - `Remesh.extern`.

- `extern`: a set of abstract interface definitions
- `extern-impl`: a specific implementation that satisfies the `extern` interface

The concrete usage is as follows

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

In the remesh domain, use ``extern`'' like this.

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

Inject `extern-impl` in the following way.

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

Different `extern-impl`s can be injected in different environments.

## How do I get the remesh domain to support server-side rendering?

remesh provides an API to support server-side rendering - `domain.preload`, the usage of which is shown below.

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

In frameworks that support SSR, do something like the following (using next.js as an example).

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

## How to get the return type of a domain?

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
