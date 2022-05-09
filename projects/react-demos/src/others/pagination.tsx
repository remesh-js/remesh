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

    const UserListQuery = domain.query({
      name: 'UserListQuery',
      impl: ({ get }) => {
        return get(UserListState())
      },
    })

    const IsEmptyUserListQuery = domain.query({
      name: 'IsEmptyUserListQuery',
      impl: ({ get }) => {
        const userList = get(UserListState())
        return userList.length === 0
      },
    })

    const NextPaginationQuery = domain.query({
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
        const nextPagination = get(NextPaginationQuery())
        const currentUserList = get(UserListState())
        return [PaginationState().new(nextPagination), UserListState().new(currentUserList.concat(result.value))]
      },
    })

    domain.ignite(() => userFetcher.command.LoadCommand(defaultPagination))

    const LoadMoreCommand = domain.command({
      name: 'LoadMoreCommand',
      impl: ({ get }) => {
        const nextPagination = get(NextPaginationQuery())
        return userFetcher.command.LoadCommand(nextPagination)
      },
    })

    const ResetCommand = domain.command({
      name: 'ResetCommand',
      impl: ({}) => {
        return [PaginationState().new(defaultPagination), UserListState().new([]), LoadMoreCommand()]
      },
    })

    return {
      query: {
        UserListQuery,
        IsEmptyUserListQuery,
        IsLoadingQuery: userFetcher.query.IsLoadingQuery,
        AsyncDataQuery: userFetcher.query.AsyncDataQuery,
      },
      command: {
        LoadMoreCommand: LoadMoreCommand,
        ResetCommand: ResetCommand,
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
  const isEmptyUserList = useRemeshQuery(paginationDomain.query.IsEmptyUserListQuery())

  return (
    <div>
      <h2>Pagination</h2>
      {isEmptyUserList ? 'loading...' : <UserListView />}
    </div>
  )
}

const UserListView = () => {
  const paginationDomain = useRemeshDomain(PaginationDomain())

  const isLoading = useRemeshQuery(paginationDomain.query.IsLoadingQuery())

  const handleRest = () => {
    paginationDomain.command.ResetCommand()
  }

  const handleLoadMore = () => {
    paginationDomain.command.LoadMoreCommand()
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

  const userList = useRemeshQuery(paginationDomain.query.UserListQuery())

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
