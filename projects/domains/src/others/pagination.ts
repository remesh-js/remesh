import { Remesh } from 'remesh'
import { AsyncModule, AsyncData } from 'remesh/modules/async'

import { Pagination, UserList, getUserList } from './github-users'

export const PaginationDomain = Remesh.domain({
  name: 'PaginationDomain',
  impl: (domain) => {
    const defaultPagination: Pagination = {
      offset: 0,
      pageSize: 10,
    }

    const PaginationState = domain.state({
      name: 'PaginationState',
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
        const userList = get(UserListQuery())
        return userList.length === 0
      },
    })

    const NextPaginationQuery = domain.query({
      name: 'NextPaginationQuery',
      impl: ({ get }) => {
        const pagination = get(PaginationState())
        const userList = get(UserListQuery())

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

    const UserFetcher = AsyncModule<Pagination, UserList>(domain, {
      name: 'UserFetcher',
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

    domain.ignite(() => UserFetcher.command.LoadCommand(defaultPagination))

    const LoadMoreCommand = domain.command({
      name: 'LoadMoreCommand',
      impl: ({ get }) => {
        const nextPagination = get(NextPaginationQuery())
        return UserFetcher.command.LoadCommand(nextPagination)
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
        IsLoadingQuery: UserFetcher.query.IsLoadingQuery,
        AsyncDataQuery: UserFetcher.query.AsyncDataQuery,
      },
      command: {
        LoadMoreCommand: LoadMoreCommand,
        ResetCommand: ResetCommand,
      },
      event: {
        LoadingUsersEvent: UserFetcher.event.LoadingEvent,
        SuccessToLoadUsersEvent: UserFetcher.event.SuccessEvent,
        FailedToLoadUsersEvent: UserFetcher.event.FailedEvent,
      },
    }
  },
})
