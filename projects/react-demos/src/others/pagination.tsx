import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { PaginationDomain } from 'remesh-domains-for-demos/dist/others/pagination'
import { AsyncData } from 'remesh/modules/async'

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
  const send = useRemeshSend()
  const paginationDomain = useRemeshDomain(PaginationDomain())

  const asyncData = useRemeshQuery(paginationDomain.query.AsyncDataQuery())

  const isLoading = AsyncData.isLoading(asyncData)

  const handleRest = () => {
    send(paginationDomain.command.ResetCommand())
  }

  const handleLoadMore = () => {
    send(paginationDomain.command.LoadMoreCommand())
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
