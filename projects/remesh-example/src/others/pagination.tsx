import React from 'react'
import { Remesh } from 'remesh'

import { AsyncModule } from 'remesh/modules/async'
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
        if (result.type !== 'resolved') {
          return null
        }
        const currentUserList = get(UserListState())
        return UserListState().new(currentUserList.concat(result.value))
      },
      initialArg: defaultPagination,
    })

    const IsFetchingUserListQuery = domain.query({
      name: 'IsFetchingUserListQuery',
      impl: ({ get }) => {
        const asyncState = get(userFetcher.query.AsyncQuery())
        return asyncState.type === 'pending'
      },
    })

    const loadMore = domain.command({
      name: 'loadMore',
      impl: ({ get }) => {
        const nextPagination = get(NextPaginationQuery())
        return [PaginationState().new(nextPagination), userFetcher.command.load(nextPagination)]
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
        UserListQuery: UserListState.Query,
        IsEmptyUserListQuery,
        IsFetchingUserListQuery,
      },
      command: {
        loadMore,
        reset,
      },
      event: {
        UserFetchingEvent: userFetcher.event.PendingEvent,
        UserFetchedSuccessEvent: userFetcher.event.ResolvedEvent,
        UserFetchFailedEvent: userFetcher.event.RejectedEvent,
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
      {isEmptyUserList ? 'loading...' : <UserList />}
    </div>
  )
}

const UserList = () => {
  const paginationDomain = useRemeshDomain(PaginationDomain())

  const userList = useRemeshQuery(paginationDomain.query.UserListQuery())
  const isFetchingUserList = useRemeshQuery(paginationDomain.query.IsFetchingUserListQuery())

  return (
    <>
      <div>
        <button onClick={() => paginationDomain.command.reset()}>reset</button>
      </div>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
        {!isFetchingUserList && <button onClick={() => paginationDomain.command.loadMore()}>load more</button>}
        {isFetchingUserList && 'loading...'}
      </div>
    </>
  )
}
