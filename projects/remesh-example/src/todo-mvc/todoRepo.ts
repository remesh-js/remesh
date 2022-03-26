import { Remesh } from 'remesh'
import localforage from 'localforage'
import type { Todo } from './todo'

type TodoRepo = {
  getTodoList: () => Promise<Todo[]>
  addTodo: (todo: Todo) => void
  removeTodoByIds: (ids: Todo['id'][]) => void
  updateTodo: (updateTodo: Todo) => void
  toggleCompletedByIds: (ids: Todo['id'][], completed: boolean) => void
}

const storageKey = 'todo-mvc-data'
const getTodoList = () => {
  return localforage.getItem<Todo[]>(storageKey).then((value) => value ?? [])
}

export const TodoRepoExtern = Remesh.extern<TodoRepo>({
  name: 'TodoRepoExtern',
  default: {
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
  },
})
