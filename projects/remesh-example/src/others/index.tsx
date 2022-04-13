import React, { StrictMode, Suspense, useEffect, useTransition } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Remesh } from 'remesh'

import { ListModule } from 'remesh/modules/list'

import { debounce } from 'remesh/schedulers/debounce'
import { throttle } from 'remesh/schedulers/throttle'

import { RemeshRoot, useRemeshAsyncQuery, useRemeshDomain, useRemeshQuery, useRemeshSuspenseQuery } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

type Pagination = {
  offset: number
  pageSize: number
}

const TestDomain = Remesh.domain({
  name: 'test',
  impl: (domain) => {
    const CountState = domain.state({
      name: 'CountState',
      default: 0,
    })

    const CountIncreQuery = domain.query({
      name: 'CountIncreQuery',
      impl: async ({ get }) => {
        const count = get(CountState())
        await delay(1000)
        return count + 1
      },
    })

    const CountDecreQuery = domain.query({
      name: 'CountDecreQuery',
      impl: async ({ get }) => {
        const count = get(CountState())
        await delay(1000)
        return count - 1
      },
    })

    const CountDoubleQuery = domain.query({
      name: 'CountDoubleQuery',
      impl: async ({ get }) => {
        const count = await get(CountState())
        await delay(1000)
        return count * 2
      },
    })

    const CountQuery = domain.query({
      name: 'CountQuery',
      scheduler: debounce(0),
      impl: async ({ get }) => {
        const [incre, decre, double] = await Promise.all([
          get(CountIncreQuery()),
          get(CountDecreQuery()),
          get(CountDoubleQuery()),
        ])
        return { incre, decre, double }
      },
    })

    const UnwrappedCountQuery = domain.query({
      name: 'UnwrappedCountQuery',
      scheduler: throttle(0),
      impl: ({ unwrap }) => {
        const data = unwrap(CountQuery())
        return data
      },
    })

    const incre = domain.command({
      name: 'incre',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count + 1)
      },
    })

    const decre = domain.command({
      name: 'decre',
      impl: ({ get }) => {
        const count = get(CountState())
        return CountState().new(count - 1)
      },
    })

    const paginationListModule = ListModule<Pagination>(domain, {
      name: 'PaginationListState',
      key: (state) => `${state.offset}-${state.pageSize}`,
      default: [
        {
          offset: 0,
          pageSize: 10,
        },
      ],
    })

    const UsersQuery = domain.query({
      name: 'UsersQuery',
      impl: async (_, pagination: Pagination) => {
        const response = await fetch(
          `https://api.github.com/users?since=${pagination.offset}&per_page=${pagination.pageSize}`,
        )
        const json = await response.json()
        return json
      },
    })

    const UserListQuery = domain.query({
      name: 'UserListQuery',
      impl: async ({ get }) => {
        const paginationList = get(paginationListModule.query.ItemListQuery())
        const usersList = await Promise.all(paginationList.map((pagination) => get(UsersQuery(pagination))))
        return usersList.flat(Number.POSITIVE_INFINITY)
      },
    })

    const NextPaginationQuery = domain.query({
      name: 'NextPaginationQuery',
      impl: async ({ get }): Promise<Pagination> => {
        const paginationList = get(paginationListModule.query.ItemListQuery())

        if (paginationList.length === 0) {
          return {
            offset: 0,
            pageSize: 10,
          }
        }

        const lastPagination = paginationList[paginationList.length - 1]
        const users = await get(UsersQuery(lastPagination))
        const lastUser = users[users.length - 1]

        const nextPagination = {
          offset: lastUser.id + 1,
          pageSize: lastPagination.pageSize,
        }

        return nextPagination
      },
    })

    const loadMoreUsers = domain.command({
      name: 'loadMoreUsers',
      impl: ({}, nextPagination: Pagination) => {
        return paginationListModule.command.addItem(nextPagination)
      },
    })

    return {
      query: {
        CountQuery,
        UnwrappedCountQuery,
        UserListQuery,
        NextPaginationQuery,
      },
      command: {
        incre,
        decre,
        loadMoreUsers,
      },
    }
  },
})

const App = () => {
  const testDomain = useRemeshDomain(TestDomain())

  const count = useRemeshAsyncQuery(testDomain.query.CountQuery())
  const unwrappedCount = useRemeshQuery(testDomain.query.UnwrappedCountQuery())

  return (
    <div>
      <h3>Commands</h3>
      <button onClick={() => testDomain.command.incre()}>Increment</button>{' '}
      <button onClick={() => testDomain.command.decre()}>Decrement</button>
      <div>
        <h3>Async Query</h3>
        <pre>{JSON.stringify(count, null, 2)}</pre>
      </div>
      <div>
        <h3>Unwrapped Query</h3>
        <pre>{JSON.stringify(unwrappedCount, null, 2)}</pre>
      </div>
      <div>
        <h3>Suspense Query</h3>
        <Suspense fallback="loading...">
          <Count />
        </Suspense>
      </div>
      <div>
        <h3>User List Query</h3>
        <Suspense fallback="loading...">
          <UserList />
        </Suspense>
      </div>
    </div>
  )
}

const UserList = () => {
  const [pending, transition] = useTransition()
  const testDomain = useRemeshDomain(TestDomain())

  const userList = useRemeshSuspenseQuery(testDomain.query.UserListQuery())
  const nextPagination = useRemeshSuspenseQuery(testDomain.query.NextPaginationQuery())

  const loadMoreUsers = () => {
    transition(() => {
      testDomain.command.loadMoreUsers(nextPagination)
    })
  }

  console.log('pending', pending)

  return (
    <>
      <button onClick={loadMoreUsers}>load more</button>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
        {userList.map((user) => {
          return (
            <div style={{ width: 100, margin: 10 }} key={user.html_url}>
              <img style={{ width: 100 }} src={user.avatar_url} />
              <p>
                <a href={user.html_url}>{user.login}</a>
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}

const Count = () => {
  const testDomain = useRemeshDomain(TestDomain())

  const count = useRemeshSuspenseQuery(testDomain.query.CountQuery())

  return <pre>{JSON.stringify(count, null, 2)}</pre>
}

const rootElem = document.getElementById('root')

if (rootElem) {
  const root = ReactDOMClient.createRoot(rootElem)
  const store = Remesh.store({
    inspectors: [
      RemeshReduxDevtools(),
      RemeshLogger({
        include: ['command', 'query', 'event', 'domain', 'command$', 'state'],
      }),
    ],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <App />
      </RemeshRoot>
      ,
    </StrictMode>,
  )
}
