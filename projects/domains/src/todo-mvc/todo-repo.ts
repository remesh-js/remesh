import { Remesh } from 'remesh'
import type { Todo } from '.'

type TodoRepo = {
  getTodoList: () => Promise<Todo[]>
  addTodo: (todo: Todo) => void
  removeTodoByIds: (ids: Todo['id'][]) => void
  updateTodo: (updateTodo: Todo) => void
  toggleCompletedByIds: (ids: Todo['id'][], completed: boolean) => void
}

export const TodoRepoExtern = Remesh.extern<TodoRepo>({
  name: 'TodoRepoExtern',
  default: {
    async getTodoList() {
      throw new Error('Not implemented')
    },
    async addTodo() {
      throw new Error('Not implemented')
    },
    async removeTodoByIds() {
      throw new Error('Not implemented')
    },
    async updateTodo() {
      throw new Error('Not implemented')
    },

    async toggleCompletedByIds() {
      throw new Error('Not implemented')
    },
  },
})
