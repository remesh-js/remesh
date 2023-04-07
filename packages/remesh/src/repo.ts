import { Serializable } from './serializable'

export type RepoCtor<T extends object> = new () => Repo<T>

export type AnyRepo = Repo<any>

export type InferRepoInput<T extends Repo<object>> = T extends Repo<infer R> ? R : never

type ExtractValues<T, Default> = undefined extends T ? Default : (T & unknown[])[number]

export type Filter<T, Includes, Excludes> = Exclude<
  T & ExtractValues<Includes, unknown>,
  ExtractValues<Excludes, never>
>

export type InferRepo<T> = T extends AnyRepo ? T['__type'] : never

export type FilterKeyField<T extends object> = keyof {
  [key in keyof T as T[key] extends string | number ? key : never]: true
}

export type RepoQueryFn<T extends AnyRepo> = (entity: InferRepo<T>) => boolean

export type FindQuery<T extends AnyRepo> = {
  type: 'FindQuery'
  Repo: new () => T
  payload: Partial<InferRepo<T>> | RepoQueryFn<T>
}

export type FindAllQuery<T extends AnyRepo> = {
  type: 'FindAllQuery'
  Repo: new () => T
}

export type FindManyQuery<T extends AnyRepo> = {
  type: 'FindManyQuery'
  Repo: new () => T
  payload: Partial<InferRepo<T>>[] | RepoQueryFn<T>
}

export type RepoQuery<T extends AnyRepo> = FindQuery<T> | FindAllQuery<T> | FindManyQuery<T>

export type AddMutation<T extends AnyRepo> = {
  type: 'AddMutation'
  Repo: new () => T
  payload: InferRepo<T>
}

export type AddManyMutation<T extends AnyRepo> = {
  type: 'AddManyMutation'
  Repo: new () => T
  payload: InferRepo<T>[]
}

export type UpdateMutationPayload<T extends AnyRepo> = Partial<Omit<InferRepo<T>, T['key']>> & {
  [key in T['key']]: InferRepo<T>[T['key']]
}

export type RepoUpdateMutationFn<T extends AnyRepo> = (entity: InferRepo<T>) => InferRepo<T>

export type UpdateMutation<T extends AnyRepo> = {
  type: 'UpdateMutation'
  Repo: new () => T
  payload: UpdateMutationPayload<T> | RepoUpdateMutationFn<T>
}

export type UpdateManyMutation<T extends AnyRepo> = {
  type: 'UpdateManyMutation'
  Repo: new () => T
  payload: UpdateMutationPayload<T>[] | RepoUpdateMutationFn<T>
}

export type RepoDeleteMutationFn<T extends AnyRepo> = (entity: InferRepo<T>) => boolean

export type DeleteMutation<T extends AnyRepo> = {
  type: 'DeleteMutation'
  Repo: new () => T
  payload: T['__keyType'] | RepoDeleteMutationFn<T>
}

export type DeleteManyMutation<T extends AnyRepo> = {
  type: 'DeleteManyMutation'
  Repo: new () => T
  payload: T['__keyType'][] | RepoDeleteMutationFn<T>
}

export type RepoMutation<T extends AnyRepo> =
  | AddMutation<T>
  | AddManyMutation<T>
  | UpdateMutation<T>
  | UpdateManyMutation<T>
  | DeleteMutation<T>
  | DeleteManyMutation<T>

export abstract class Repo<T extends object> {
  static find<R extends AnyRepo>(this: new () => R, payload: FindQuery<R>['payload']): FindQuery<R> {
    return {
      type: 'FindQuery',
      Repo: this,
      payload,
    }
  }
  static findAll<R extends AnyRepo>(this: new () => R): FindAllQuery<R> {
    return {
      type: 'FindAllQuery',
      Repo: this,
    }
  }
  static findMany<R extends AnyRepo>(this: new () => R, payload: FindManyQuery<R>['payload']): FindManyQuery<R> {
    return {
      type: 'FindManyQuery',
      Repo: this,
      payload,
    }
  }
  static add<R extends AnyRepo>(this: new () => R, payload: AddMutation<R>['payload']): AddMutation<R> {
    return {
      type: 'AddMutation',
      Repo: this,
      payload,
    }
  }
  static addMany<R extends AnyRepo>(this: new () => R, payload: AddManyMutation<R>['payload']): AddManyMutation<R> {
    return {
      type: 'AddManyMutation',
      Repo: this,
      payload,
    }
  }
  static update<R extends AnyRepo>(this: new () => R, payload: UpdateMutation<R>['payload']): UpdateMutation<R> {
    return {
      type: 'UpdateMutation',
      Repo: this,
      payload,
    }
  }
  static updateMany<R extends AnyRepo>(
    this: new () => R,
    payload: UpdateManyMutation<R>['payload'],
  ): UpdateManyMutation<R> {
    return {
      type: 'UpdateManyMutation',
      Repo: this,
      payload,
    }
  }
  static delete<R extends AnyRepo>(this: new () => R, payload: DeleteMutation<R>['payload']): DeleteMutation<R> {
    return {
      type: 'DeleteMutation',
      Repo: this,
      payload,
    }
  }
  static deleteMany<R extends AnyRepo>(
    this: new () => R,
    payload: DeleteManyMutation<R>['payload'],
  ): DeleteManyMutation<R> {
    return {
      type: 'DeleteManyMutation',
      Repo: this,
      payload,
    }
  }
  __type!: {
    [key in Filter<keyof T, this['includes'], this['excludes']> | this['key']]: key extends keyof T ? T[key] : never
  }
  abstract key: FilterKeyField<T>
  __keyType!: this['key'] extends keyof T ? T[this['key']] : never
  includes?: readonly (keyof T)[]
  excludes?: readonly (keyof T)[]
}

export interface QueryFn {
  <T extends AnyRepo>(query: FindQuery<T>): T['__type'] | null
  <T extends AnyRepo>(query: FindAllQuery<T>): T['__type'][]
  <T extends AnyRepo>(query: FindManyQuery<T>): T['__type'][]
}

export interface MutationFn {
  <T extends AnyRepo>(query: AddMutation<T>): T['__type']
  <T extends AnyRepo>(query: AddManyMutation<T>): T['__type'][]
  <T extends AnyRepo>(query: UpdateMutation<T>): T['__type'] | null
  <T extends AnyRepo>(query: UpdateManyMutation<T>): (T['__type'] | null)[]
  <T extends AnyRepo>(query: DeleteMutation<T>): T['__type'] | null
  <T extends AnyRepo>(query: DeleteManyMutation<T>): (T['__type'] | null)[]
}

export type Context = {
  query: QueryFn
  mutation: MutationFn
}

export abstract class State {
  query?: {
    [key: string]: new () => Query
  }
  command?: {
    [key: string]: new () => Command
  }
}

export type BoundedRepoQuery<T extends AnyRepo> = {
  find(payload: FindQuery<T>['payload']): T['__type'] | null
  findAll(): T['__type'][]
  findMany(payload: FindManyQuery<T>['payload']): T['__type'][]
}

export type BoundedRepoMutation<T extends AnyRepo> = {
  add(payload: AddMutation<T>['payload']): T['__type']
  addMany(payload: AddManyMutation<T>['payload']): T['__type'][]
  update(payload: UpdateMutation<T>['payload']): T['__type'] | null
  updateMany(payload: UpdateManyMutation<T>['payload']): (T['__type'] | null)[]
  delete(payload: DeleteMutation<T>['payload']): T['__type'] | null
  deleteMany(payload: DeleteManyMutation<T>['payload']): (T['__type'] | null)[]
}

export type BoundedRepo<T extends AnyRepo> = BoundedRepoQuery<T> & BoundedRepoMutation<T>

export type QueryContext = Pick<Context, 'query'>

export abstract class Query {
  query: QueryContext['query']
  constructor(context: QueryContext) {
    this.query = context.query
  }
  use<T extends AnyRepo>(Ctor: new () => T): BoundedRepoQuery<T> {
    const boundedRepoQuery = {} as BoundedRepoQuery<T>
    return boundedRepoQuery
  }
  abstract impl(input: Serializable): unknown
}

export type CommandContext = Pick<Context, 'query' | 'mutation'>

export abstract class Command {
  query: CommandContext['query']
  mutation: CommandContext['mutation']
  constructor(context: CommandContext) {
    this.query = context.query
    this.mutation = context.mutation
  }
  use<T extends AnyRepo>(Ctor: new () => T): BoundedRepo<T> {
    const boundedRepo = {} as BoundedRepo<T>
    return boundedRepo
  }
  abstract impl(...args: unknown[]): unknown
}

type User = {
  id: number
  name: string
  parent?: User
}

class UserRepo extends Repo<User> {
  key = 'id' as const
  excludes = ['parent'] as const
}

type Circle = {
  id: number
  type: 'circle'
  radius: number
}

type Rect = {
  id: number
  type: 'rect'
  width: number
  height: number
}

type Shape = Circle | Rect

class CircleRepo extends Repo<Circle> {
  key = 'id' as const
}

class RectRepo extends Repo<Rect> {
  key = 'id' as const
}

type Todo = {
  id: number
  content: string
  completed: boolean
}

class TodoRepo extends Repo<Todo> {
  key = 'id' as const
}

type TodoFilter = 'active' | 'all' | 'completed'

class FilterTodoQuery extends Query {
  TodoRepo = this.use(TodoRepo)

  impl(filter: TodoFilter) {
    const todos = this.TodoRepo.find((todo) => {
      if (filter === 'active') {
        return !todo.completed
      }

      if (filter === 'completed') {
        return todo.completed
      }
      return true
    })

    return todos
  }
}

class AddTodoCommand extends Command {
  TodoRepo = this.use(TodoRepo)

  impl(todoContent: string) {
    const newTodo = this.TodoRepo.add({
      id: Math.random(),
      content: todoContent,
      completed: false,
    })

    return newTodo
  }
}
