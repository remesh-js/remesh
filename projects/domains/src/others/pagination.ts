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

    const SetPaginationCommand = domain.command({
      name: 'SetPaginationCommand',
      impl: ({ get }, pagination: Pagination) => {
        return PaginationState().new(pagination)
      },
    })

    const SetUserListCommand = domain.command({
      name: 'SetUserListCommand',
      impl: ({ get }, userList: UserList) => {
        return UserListState().new(userList)
      },
    })

    const UserAsyncModule = AsyncModule<Pagination, UserList>(domain, {
      name: 'UserAsyncModule',
      load: async ({}, pagination) => {
        const newUserList = await getUserList(pagination)
        return newUserList
      },
      onSuccess: ({ get }, result) => {
        const nextPagination = get(NextPaginationQuery())
        const currentUserList = get(UserListState())

        return [SetPaginationCommand(nextPagination), SetUserListCommand([...currentUserList, ...result])]
      },
    })

    domain.effect({
      name: 'UserEffect',
      impl: ({}) => {
        return [UserAsyncModule.command.LoadCommand(defaultPagination)]
      },
    })

    const LoadMoreCommand = domain.command({
      name: 'LoadMoreCommand',
      impl: ({ get }) => {
        const nextPagination = get(NextPaginationQuery())
        return UserAsyncModule.command.LoadCommand(nextPagination)
      },
    })

    const ResetCommand = domain.command({
      name: 'ResetCommand',
      impl: ({}) => {
        return [SetPaginationCommand(defaultPagination), SetUserListCommand([]), LoadMoreCommand()]
      },
    })

    return {
      query: {
        UserListQuery,
        IsEmptyUserListQuery,
        AsyncDataQuery: UserAsyncModule.query.AsyncDataQuery,
      },
      command: {
        LoadMoreCommand: LoadMoreCommand,
        ResetCommand: ResetCommand,
      },
      event: {
        LoadingUsersEvent: UserAsyncModule.event.LoadingEvent,
        SuccessToLoadUsersEvent: UserAsyncModule.event.SuccessEvent,
        FailedToLoadUsersEvent: UserAsyncModule.event.FailedEvent,
      },
    }
  },
})
