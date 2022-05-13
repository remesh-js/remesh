import localforage from 'localforage'
import type { Todo } from 'remesh-domains-for-demos/dist/todo-mvc'
import { TodoRepoExtern } from 'remesh-domains-for-demos/dist/todo-mvc/todo-repo'

const storageKey = 'todo-mvc-data'
const getTodoList = () => {
  return localforage.getItem<Todo[]>(storageKey).then((value) => value ?? [])
}

export const TodoRepoExternImpl = TodoRepoExtern.impl({
  async getTodoList() {
    return getTodoList()
  },
  async addTodo(todo: Todo) {
    let data = await getTodoList()
    await localforage.setItem(storageKey, data.concat(todo))
  },
  async removeTodoByIds(ids) {
    let data = await getTodoList()
    await localforage.setItem(
      storageKey,
      data.filter((item) => !ids.includes(item.id)),
    )
  },
  async updateTodo(updateTodo) {
    let data = await getTodoList()
    await localforage.setItem(
      storageKey,
      data.map((todo) => (todo.id === updateTodo.id ? { ...todo, ...updateTodo } : todo)),
    )
  },

  async toggleCompletedByIds(ids, completed) {
    let data = await getTodoList()
    await localforage.setItem(
      storageKey,
      data.map((todo) => (ids.includes(todo.id) ? { ...todo, completed } : todo)),
    )
  },
})
