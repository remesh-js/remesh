import React from 'react'
import { Remesh } from 'remesh'

import { AsyncModule, AsyncData } from 'remesh/modules/async'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { Pagination, UserList, getUserList } from './github-users'

const PaginationDomain = Remesh.domain({
  name: 'pagination',
  impl: (domain) => {
    const defaultPagination: Pagination = {
      offset: 0,
      pageSize: 10,
    }

    const PaginationState = domain.state({
      name: 'Pagination',
      default: defaultPagination,
    })

    const UserListState = domain.state<UserList>({
      name: 'UserListState',
      default: [],
    })

    const isEmptyUserList = domain.query({
      name: 'isEmptyUserList',
      impl: ({ get }) => {
        const userList = get(UserListState())
        return userList.length === 0
      },
    })

    const nextPaginationQuery = domain.query({
      name: 'NextPaginationQuery',
      impl: ({ get }) => {
        const pagination = get(PaginationState())
        const userList = get(UserListState())

        if (userList.length === 0) {
          return pagination
        }

        const lastUser = userList[userList.length - 1]

        const nextPagination = {
          ...pagination,
          offset: lastUser.id + 1,
        }

        return nextPagination
      },
    })

    const userFetcher = AsyncModule<Pagination, UserList>(domain, {
      name: 'userFetcher',
      query: async ({}, pagination) => {
        const newUserList = await getUserList(pagination)
        return newUserList
      },
      command: ({ get }, result) => {
        if (!AsyncData.isSuccess(result)) {
          return null
        }
        const nextPagination = get(nextPaginationQuery())
        const currentUserList = get(UserListState())
        return [PaginationState().new(nextPagination), UserListState().new(currentUserList.concat(result.value))]
      },
    })

    domain.ignite(() => userFetcher.command.load(defaultPagination))

    const loadMore = domain.command({
      name: 'loadMore',
      impl: ({ get }) => {
        const nextPagination = get(nextPaginationQuery())
        return userFetcher.command.load(nextPagination)
      },
    })

    const reset = domain.command({
      name: 'reset',
      impl: ({}) => {
        return [PaginationState().new(defaultPagination), UserListState().new([]), loadMore()]
      },
    })

    return {
      query: {
        userList: UserListState.query,
        isEmptyUserList,
        isLoading: userFetcher.query.isLoading,
        asyncState: userFetcher.query.asyncState,
      },
      command: {
        loadMore,
        reset,
      },
      event: {
        LoadingUsersEvent: userFetcher.event.LoadingEvent,
        SuccessToLoadUsersEvent: userFetcher.event.SuccessEvent,
        FailedToLoadUsersEvent: userFetcher.event.FailedEvent,
      },
    }
  },
})

export default () => {
  const paginationDomain = useRemeshDomain(PaginationDomain())
  const isEmptyUserList = useRemeshQuery(paginationDomain.query.isEmptyUserList())

  return (
    <div>
      <h2>Pagination</h2>
      {isEmptyUserList ? 'loading...' : <UserList />}
    </div>
  )
}

const UserList = () => {
  const paginationDomain = useRemeshDomain(PaginationDomain())

  const isLoading = useRemeshQuery(paginationDomain.query.isLoading())

  const handleRest = () => {
    paginationDomain.command.reset()
  }

  const handleLoadMore = () => {
    paginationDomain.command.loadMore()
  }

  return (
    <>
      <div>
        <button onClick={handleRest}>reset</button>
      </div>
      <UserListContent />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
        {!isLoading && <button onClick={handleLoadMore}>load more</button>}
        {isLoading && 'loading...'}
      </div>
    </>
  )
}

const UserListContent = () => {
  const paginationDomain = useRemeshDomain(PaginationDomain())

  const userList = useRemeshQuery(paginationDomain.query.userList())

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
      {userList.map((user) => {
        return (
          <div style={{ width: 100, margin: 10 }} key={user.id}>
            <img style={{ width: 100, height: 100 }} src={user.avatar_url} loading="lazy" />
            <p>
              <a href={user.html_url}>{user.login}</a>
            </p>
          </div>
        )
      })}
    </div>
  )
}
