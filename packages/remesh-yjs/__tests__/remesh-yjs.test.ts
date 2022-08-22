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
      default: [
        {
          id: '1',
          text: 'Hello',
          done: false,
        },
      ],
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

describe('remesh-yjs', () => {
  it('should sync', () => {
    const doc1 = new Y.Doc()

    const doc2 = new Y.Doc()

    doc1.on('update', (update) => {
      Y.applyUpdate(doc2, update)
    })

    const store = Remesh.store({
      externs: [RemeshYjsExtern.impl({ doc: doc1 })],
    })

    store.igniteDomain(TestDomain())

    const testDomain = store.getDomain(TestDomain())

    const jsonValue0 = doc2.getArray('todo-list').toJSON()

    expect(jsonValue0).toEqual([
      {
        id: '1',
        text: 'Hello',
        done: false,
      },
    ])

    expect(store.query(testDomain.query.ItemListQuery())).toEqual([
      {
        id: '1',
        text: 'Hello',
        done: false,
      },
    ])

    store.send(
      testDomain.command.AddItemCommand({
        id: '2',
        text: 'World',
        done: false,
      }),
    )

    const jsonValue1 = doc2.getArray('todo-list').toJSON()

    expect(jsonValue1).toEqual([
      {
        id: '1',
        text: 'Hello',
        done: false,
      },
      {
        id: '2',
        text: 'World',
        done: false,
      },
    ])

    expect(store.query(testDomain.query.ItemListQuery())).toEqual([
      {
        id: '1',
        text: 'Hello',
        done: false,
      },
      {
        id: '2',
        text: 'World',
        done: false,
      },
    ])

    store.send([
      testDomain.command.UpdateItemCommand({
        id: '2',
        text: 'World!',
        done: true,
      }),

      testDomain.command.DeleteItemCommand('1'),
    ])

    const jsonValue2 = doc2.getArray('todo-list').toJSON()

    expect(jsonValue2).toEqual([
      {
        id: '2',
        text: 'World!',
        done: true,
      },
    ])

    expect(store.query(testDomain.query.ItemListQuery())).toEqual([
      {
        id: '2',
        text: 'World!',
        done: true,
      },
    ])

    doc1.getArray('todo-list').delete(0)

    const jsonValue3 = doc2.getArray('todo-list').toJSON()

    expect(jsonValue3).toEqual([])

    expect(store.query(testDomain.query.ItemListQuery())).toEqual([])

    doc1.getArray('todo-list').insert(0, [
      {
        id: '3',
        text: 'Hello',
        done: false,
      },
    ])

    const jsonValue4 = doc2.getArray('todo-list').toJSON()

    expect(jsonValue4).toEqual([
      {
        id: '3',
        text: 'Hello',
        done: false,
      },
    ])

    expect(store.query(testDomain.query.ItemListQuery())).toEqual([
      {
        id: '3',
        text: 'Hello',
        done: false,
      },
    ])
  })
})
