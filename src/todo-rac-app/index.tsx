import React, { useEffect, useState } from "react"

import {
  useRemeshEmit,
  useRemeshEvent,
  useRemeshQuery,
  useRemeshDomain,
} from "../remesh/react"

import {
  createAbstractComponent,
  RacProvider,
} from "../react-abstract-component"

import {
  Todo,
  TodoAppHeaderDomain,
  TodoAppMainDomain,
  TodoAppFooterDomain,
} from "../todo-app/domains/todoApp"
import { TodoFilter } from "./domains/todoFilter"

type TodoHeaderUIProps = {
  todoInput: string
  isAllCompleted: boolean
  onToggleAll?: () => unknown
  onTodoInput?: (value: string) => unknown
  onAddTodo?: (value: string) => unknown
}

const TodoHeaderUI = createAbstractComponent<TodoHeaderUIProps>({
  name: "TodoHeaderUI",
})

const TodoHeader = () => {
  const emit = useRemeshEmit()

  const todoAppHeaderDomain = useRemeshDomain(TodoAppHeaderDomain)

  const todoInput = useRemeshQuery(todoAppHeaderDomain.query.TodoInputQuery())

  const isAllCompleted = useRemeshQuery(
    todoAppHeaderDomain.query.IsAllCompletedQuery()
  )

  const handleChange = (value: string) => {
    emit(todoAppHeaderDomain.event.TodoInputEvent(value))
  }

  const handleAdd = () => {
    emit(todoAppHeaderDomain.event.AddTodoEvent(todoInput))
  }

  const handleToggleAllTodos = () => {
    emit(todoAppHeaderDomain.event.ToggleAllTodosEvent())
  }

  useRemeshEvent(todoAppHeaderDomain.event.AddTodoFailedEvent, (event) => {
    alert(event.message)
  })

  return (
    <TodoHeaderUI
      isAllCompleted={isAllCompleted}
      todoInput={todoInput}
      onAddTodo={handleAdd}
      onTodoInput={handleChange}
      onToggleAll={handleToggleAllTodos}
    />
  )
}

const TodoHeaderUIImpl = TodoHeaderUI.impl((props) => {
  return (
    <div>
      <input
        type="checkbox"
        checked={props.isAllCompleted}
        readOnly
        onClick={props.onToggleAll}
      />
      <input
        type="text"
        placeholder="Input your todo here"
        value={props.todoInput}
        onChange={(event) => props.onTodoInput?.(event.target.value)}
      />
      <button onClick={() => props.onAddTodo?.(props.todoInput)}>add</button>
    </div>
  )
})

type TodoListUIProps = {
  todoIdList: number[]
}

const TodoListUI = createAbstractComponent<TodoListUIProps>({
  name: "TodoListUI",
})

const TodoList = () => {
  const todoListDomain = useRemeshDomain(TodoAppMainDomain)
  const matchedTodoIdList = useRemeshQuery(
    todoListDomain.query.TodoIdListQuery()
  )

  return <TodoListUI todoIdList={matchedTodoIdList} />
}

const TodoListUIImpl = TodoListUI.impl((props) => {
  return (
    <div>
      {props.todoIdList.map((todoId) => {
        return <TodoItem key={todoId} todoId={todoId} />
      })}
    </div>
  )
})

type TodoItemUIProps = {
  todo: Todo
  edit: boolean
  text: string
  onEditing: (content: string) => unknown
  onRemove: () => unknown
  onToggle: () => unknown
  onEnableEdit: () => unknown
  onDisableEdit: () => unknown
  onSubmit: () => unknown
}

const TodoItemUI = createAbstractComponent<TodoItemUIProps>({
  name: "TodoItemUI",
})

type TodoItemProps = {
  todoId: number
}

const TodoItem = React.memo(function TodoItem(props: TodoItemProps) {
  const todoListDomain = useRemeshDomain(TodoAppMainDomain)
  const emit = useRemeshEmit()

  const todo = useRemeshQuery(todoListDomain.query.TodoItemQuery(props.todoId))

  const [text, setText] = useState("")
  const [edit, setEdit] = useState(false)

  const handleEditing = (value: string) => {
    setText(value)
  }

  const handleSubmit = () => {
    if (text === todo.content) {
      setEdit(false)
    } else {
      emit(
        todoListDomain.event.UpdateTodoEvent({
          todoId: todo.id,
          content: text,
        })
      )
      setText("")
      setEdit(false)
    }
  }

  const handleEnableEdit = () => {
    setEdit(true)
    setText(todo.content)
  }

  const handleRemove = () => {
    emit(todoListDomain.event.RemoveTodoEvent(props.todoId))
  }

  const handleToggle = () => {
    emit(todoListDomain.event.ToggleTodoEvent(props.todoId))
  }

  return (
    <TodoItemUI
      edit={edit}
      text={text}
      todo={todo}
      onDisableEdit={() => setEdit(true)}
      onEnableEdit={handleEnableEdit}
      onSubmit={handleSubmit}
      onToggle={handleToggle}
      onEditing={handleEditing}
      onRemove={handleRemove}
    />
  )
})

const TodoItemUIImpl = TodoItemUI.impl((props) => {
  return (
    <div>
      {!props.edit && (
        <label onDoubleClick={props.onEnableEdit}>{props.todo.content}</label>
      )}
      {props.edit && (
        <input
          type="text"
          value={props.text}
          onChange={(event) => props.onEditing(event.target.value)}
          onBlur={props.onSubmit}
        />
      )}
      <button onClick={props.onToggle}>
        {props.todo.completed ? "completed" : "active"}
      </button>
      <button onClick={props.onRemove}>remove</button>
    </div>
  )
})

type TodoFooterUIProps = {
  todoFilter: TodoFilter
  itemLeft: number
  onSwitchTodoFilter: (filter: TodoFilter) => unknown
}

const TodoFooterUI = createAbstractComponent<TodoFooterUIProps>({
  name: "TodoFooterUI",
})

const TodoFooter = () => {
  const emit = useRemeshEmit()

  const todoAppFooterDomain = useRemeshDomain(TodoAppFooterDomain)

  const itemLeft = useRemeshQuery(
    todoAppFooterDomain.query.TodoItemLeftCountQuery()
  )
  const todoFilter = useRemeshQuery(todoAppFooterDomain.query.TodoFilterQuery())

  const handleSwitchTodoFilter = (todoFilter: TodoFilter) => {
    emit(todoAppFooterDomain.event.ChangeTodoFilterEvent(todoFilter))
  }

  return (
    <TodoFooterUI
      itemLeft={itemLeft}
      todoFilter={todoFilter}
      onSwitchTodoFilter={handleSwitchTodoFilter}
    />
  )
}

const TodoFooterUIImpl = TodoFooterUI.impl((props) => {
  return (
    <div>
      <span>
        {props.itemLeft} item
        {props.itemLeft === 0 || props.itemLeft > 1 ? `s` : ""} left
      </span>
      {" | "}
      <span
        style={{
          color: props.todoFilter === "all" ? "red" : "",
        }}
        onClick={() => {
          props.onSwitchTodoFilter("all")
        }}
      >
        All
      </span>{" "}
      <span
        style={{
          color: props.todoFilter === "active" ? "red" : "",
        }}
        onClick={() => {
          props.onSwitchTodoFilter("active")
        }}
      >
        Active
      </span>{" "}
      <span
        style={{
          color: props.todoFilter === "completed" ? "red" : "",
        }}
        onClick={() => {
          props.onSwitchTodoFilter("completed")
        }}
      >
        Completed
      </span>
    </div>
  )
})

const implList = [
  TodoHeaderUIImpl,
  TodoListUIImpl,
  TodoItemUIImpl,
  TodoFooterUIImpl,
]

const debugImplList = [
  TodoHeaderUI.impl((props) => {
    console.log("TodoHeaderUI", props)
    return <></>
  }),
  TodoListUI.impl((props) => {
    console.log("TodoListUI", props)
    return <></>
  }),
  TodoItemUI.impl((props) => {
    console.log("TodoItemUI", props)
    return <></>
  }),
  TodoFooterUI.impl((props) => {
    console.log("TodoFooterUI", props)
    return <></>
  }),
]

export const TodoApp = () => {
  return (
    <RacProvider implList={debugImplList}>
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </RacProvider>
  )
}
