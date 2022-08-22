import { Remesh } from 'remesh'
import * as Y from 'yjs'
import { map } from 'rxjs/operators'
import { ListModule } from 'remesh/modules/list'

import { RemeshYjs, RemeshYjsExtern } from '../src'

type Todo = {
  id: string
  text: string
  done: boolean
}

const TestDomain = Remesh.domain({
  name: 'TestDomain',
  impl: (domain) => {
    const TodoListModule = ListModule<Todo>(domain, {
      name: 'TodoListModule',
      key: (todo) => todo.id,
    })

    RemeshYjs<Todo[]>(domain, {
      key: 'todo-list',
      dataType: 'array',
      onSend: ({ get }) => {
        return get(TodoListModule.query.ItemListQuery())
      },
      onReceive: ({}, todoList) => {
        return TodoListModule.command.SetListCommand(todoList)
      },
    })

    return TodoListModule
  },
})

const doc1 = new Y.Doc()

doc1.on('update', (update, origin) => {
  const todoList = doc1.get('todo-list').toJSON() as Todo[]

  console.log('todoList in dco1', todoList)

  if (todoList.length >= 5) {
    doc1.getArray('todo-list').delete(0, todoList.length - 1)
  }

  console.log({
    query: store.query(testDomain.query.ItemListQuery()),
    todoList: doc1.get('todo-list').toJSON(),
  })
})

const store = Remesh.store({
  externs: [RemeshYjsExtern.impl({ doc: doc1 })],
})

const testDomain = store.getDomain(TestDomain())

// store.subscribeQuery(testDomain.query.ItemListQuery(), (todoList) => {
//   console.log('todoList', todoList)
// })

// store.igniteDomain(TestDomain())

// let i = 0
// setInterval(() => {
//   store.send(testDomain.command.AddItemCommand({ id: `${i++}`, text: 'test', done: false }))
// }, 2000)

describe('remesh-yjs', () => {})
