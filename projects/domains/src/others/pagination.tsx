import { Remesh } from 'remesh'
import { AsyncModule, AsyncData } from 'remesh/modules/async'

import { Pagination, UserList, getUserList } from './github-users'

export const PaginationDomain = Remesh.domain({
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
