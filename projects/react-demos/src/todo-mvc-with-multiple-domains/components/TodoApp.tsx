import { Remesh } from 'remesh'
import { useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { RemeshYjs } from 'remesh-yjs'
import { HistoryModule } from 'remesh/modules/history'

import { useNavigate } from 'react-router-dom'

import { TodoFooter } from './TodoFooter'
import { TodoHeader } from './TodoHeader'
import { TodoList } from './TodoList'

import {
  TodoFilter,
  TodoFilterDomain,
} from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoFilter'
import { TodoInputDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoInput'
import { Todo, TodoListDomain } from 'remesh-domains-for-demos/dist/todo-mvc-with-multiple-domains/domains/TodoList'

type TodoAppState = {
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

    const TodoAppStateQuery = domain.query({
      name: 'TodoAppStateQuery',
      impl: ({ get }): TodoAppState => {
        const todos = get(todoListDomain.query.TodoListQuery())
        const filter = get(todoFilterDomain.query.TodoFilterQuery())
        const input = get(todoInputDomain.query.TodoInputQuery())
        return {
          todos,
          filter,
          input,
        }
      },
    })

    const UpdateTodoAppStateCommand = domain.command({
      name: 'UpdateTodoAppStateCommand',
      impl: ({ get }, state: TodoAppState) => {
        const filter = get(todoFilterDomain.query.TodoFilterQuery())

        return [
          todoListDomain.command.SetTodoListCommand(state.todos),
          filter !== state.filter ? TodoFilterSyncEvent(state.filter) : null,
          todoInputDomain.command.SetTodoInputCommand(state.input),
        ]
      },
    })

    RemeshYjs(domain, {
      key: 'todo-app',
      dataType: 'object',
      onSend: ({ get }): TodoAppState => {
        return get(TodoAppStateQuery())
      },
      onReceive: ({}, state: TodoAppState) => {
        return UpdateTodoAppStateCommand(state)
      },
    })

    const TodoAppHistoryModule = HistoryModule(domain, {
      name: 'TodoAppHistoryModule',
      query: ({ get }) => {
        const state = get(TodoAppStateQuery())
        return state
      },
      command: ({}, state) => {
        return UpdateTodoAppStateCommand(state)
      },
    })

    return {
      event: {
        ...TodoAppHistoryModule.event,
        TodoFilterSyncEvent,
      },
      query: {
        ...TodoAppHistoryModule.query,
      },
      command: {
        ...TodoAppHistoryModule.command,
      },
    }
  },
})

export const TodoApp = () => {
  const todoAppDomain = useRemeshDomain(TodoAppDomain())

  const navigate = useNavigate()

  useRemeshEvent(todoAppDomain.event.TodoFilterSyncEvent, (todoFilter) => {
    navigate(`/${todoFilter}`)
  })

  return (
    <>
      <div className="todoapp">
        <TodoHeader />
        <TodoList />
        <TodoFooter />
      </div>
      <Undo />
      <Redo />
    </>
  )
}

const Undo = () => {
  const send = useRemeshSend()
  const todoAppDomain = useRemeshDomain(TodoAppDomain())
  const canBack = useRemeshQuery(todoAppDomain.query.CanBackQuery())

  const handleUndo = () => {
    if (canBack) {
      send(todoAppDomain.command.BackCommand())
    }
  }

  return (
    <svg
      style={{ opacity: canBack ? 1 : 0.5, cursor: canBack ? 'pointer' : '', position: 'fixed', top: 0, left: 0 }}
      width="50px"
      height="50px"
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handleUndo}
    >
      <path d="M448 384Q389 336 335 312 280 288 224 288L224 380 60 216 224 52 224 144Q320 166 374 222 428 277 448 384Z" />
    </svg>
  )
}

const Redo = () => {
  const send = useRemeshSend()
  const todoAppDomain = useRemeshDomain(TodoAppDomain())
  const canForward = useRemeshQuery(todoAppDomain.query.CanForwardQuery())

  const handleUndo = () => {
    if (canForward) {
      send(todoAppDomain.command.ForwardCommand())
    }
  }

  return (
    <svg
      style={{
        opacity: canForward ? 1 : 0.5,
        cursor: canForward ? 'pointer' : '',
        position: 'fixed',
        top: 0,
        left: 51,
      }}
      width="50px"
      height="50px"
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handleUndo}
    >
      <path d="M64 384Q84 277 138 222 192 166 288 144L288 52 452 216 288 380 288 288Q232 288 178 312 123 336 64 384Z" />
    </svg>
  )
}
