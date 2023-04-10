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

export type UpdateMutationPayload<T extends AnyRepo> = Partial<Omit<InferRepo<T>, T['primaryKey']>> & {
  [key in T['primaryKey']]: InferRepo<T>[T['primaryKey']]
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
    [key in Filter<keyof T, this['includes'], this['excludes']> | this['primaryKey']]: key extends keyof T
      ? T[key]
      : never
  }
  abstract primaryKey: FilterKeyField<T>
  foreignKeys?: readonly (keyof T)[]
  __keyType!: this['primaryKey'] extends keyof T ? T[this['primaryKey']] : never
  includes?: readonly (keyof T)[]
  excludes?: readonly (keyof T)[]
}

export type FieldDescriptors<T extends object> = {
  [key in keyof T]: true | FieldDescriptor<T[key]>
}

export type FieldDescriptor<T> = {
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  isAutoIncrement?: T extends number ? boolean : never
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

export interface UserFn {
  <T extends Domain>(DomainCtor: new (context: DomainContext) => T): T
  <T extends AnyRepo>(RepoCtor: new () => T): BoundedRepo<T>
}

export abstract class Domain {
  protected query: QueryFn
  protected mutation: MutationFn
  protected use: UserFn
  constructor(context: DomainContext) {
    this.query = context.query
    this.mutation = context.mutation
    this.use = context.use
  }
}

export type DomainContext = {
  query: QueryFn
  mutation: MutationFn
  use: UserFn
}

export const query = () => {
  return <This extends Domain, Arg extends Serializable, Return>(
    target: (this: This, arg: Arg) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, arg: Arg) => Return>,
  ) => {
    const methodName = String(context.name)

    function replacementMethod(this: This, arg: Arg): Return {
      console.log(`LOG: Entering method '${methodName}'.`)
      const result = target.call(this, arg)
      console.log(`LOG: Exiting method '${methodName}'.`)
      return result
    }

    return replacementMethod
  }
}

export const command = () => {
  return <This extends Domain, Args extends any[]>(
    target: (this: This, ...args: Args) => void,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => void>,
  ) => {
    const methodName = String(context.name)

    function replacementMethod(this: This, ...args: Args): void {
      console.log(`LOG: Entering method '${methodName}'.`)
      const result = target.call(this, ...args)
      console.log(`LOG: Exiting method '${methodName}'.`)
      return result
    }

    return replacementMethod
  }
}

export abstract class Event<T extends Serializable = void> {
  event: T
  constructor(event: T) {
    this.event = event
  }
}

export const event = <T extends Serializable>(EventCtor: new (event: T) => Event<T>) => {
  return <This extends Domain>(
    target: (this: This, event: T) => void,
    context: ClassMethodDecoratorContext<This, (this: This, event: T) => void>,
  ) => {
    const methodName = String(context.name)

    function replacementMethod(this: This, event: T): void {
      console.log(`LOG: Entering method '${methodName}'.`)
      const result = target.call(this, event)
      console.log(`LOG: Exiting method '${methodName}'.`)
      return result
    }

    return replacementMethod
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

type User = {
  id: number
  name: string
  parent?: User
}

class UserRepo extends Repo<User> {
  primaryKey = 'id' as const
  excludes = ['parent'] as const
}

type UserRepoType = InferRepo<UserRepo>

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
  primaryKey = 'id' as const
}

class RectRepo extends Repo<Rect> {
  primaryKey = 'id' as const
}

type Todo = {
  id: number
  content: string
  completed: boolean
  todoAppId: number
}

class TodoRepo extends Repo<Todo> {
  primaryKey = 'id' as const
}

type TodoFilter = 'active' | 'all' | 'completed'

class TodoAddedEvent extends Event<Todo> {}

type TodoAppState = {
  id: number
  todos: Todo[]
  filter: TodoFilter
  input: string
}

class TodoAppRepo extends Repo<TodoAppState> {
  primaryKey = 'id' as const
  includes = ['filter', 'input'] as const
}

class TodoAppDomain extends Domain {
  TodoAppRepo = this.use(TodoAppRepo)
  TodoListDomain = this.use(TodoListDomain)

  @query()
  getTodoAppState(todoAppId: number) {
    const todoAppState = this.TodoAppRepo.find({ id: todoAppId })

    if (!todoAppState) {
      throw new Error(`TodoAppState not found: ${todoAppId}`)
    }

    return todoAppState
  }

  @query()
  getTodos(todoAppId: number) {
    const todoAppState = this.getTodoAppState(todoAppId)
    const filter = todoAppState.filter

    return this.TodoListDomain.getTodos(todoAppId).filter((todo) => {
      if (filter === 'active') {
        return !todo.completed
      }

      if (filter === 'completed') {
        return todo.completed
      }
      return true
    })
  }
}

class TodoListDomain extends Domain {
  protected TodoRepo = this.use(TodoRepo)

  @query()
  getTodos(todoAppId: number) {
    return this.TodoRepo.findMany((todo) => todo.todoAppId === todoAppId)
  }

  @command()
  addTodo(todoAppId: number, todoContent: string) {
    this.TodoRepo.add({
      id: Math.random(),
      content: todoContent,
      completed: false,
      todoAppId,
    })
  }
}
