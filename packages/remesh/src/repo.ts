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

export type UpdateMutationPayload<T extends AnyRepo> = Partial<Omit<InferRepo<T>, T['primaryKey']>> & {
  [key in T['primaryKey']]: InferRepo<T>[T['primaryKey']]
}

export type RepoUpdateMutationFn<T extends AnyRepo> = (entity: InferRepo<T>) => InferRepo<T>

export type RepoDeleteMutationFn<T extends AnyRepo> = (entity: InferRepo<T>) => boolean

const repoEventCtorWeakMap = new WeakMap<new () => AnyRepo, new (event: any) => Event<any>>()

export abstract class Repo<T extends object> {
  static AddedEvent<T extends AnyRepo>(this: new () => T) {
    if (repoEventCtorWeakMap.has(this)) {
      return repoEventCtorWeakMap.get(this)!
    }
    class AddedEvent extends Event<InferRepo<T>> {}
    repoEventCtorWeakMap.set(this, AddedEvent)
    return AddedEvent
  }

  static UpdatedEvent<T extends AnyRepo>(this: new () => T) {
    if (repoEventCtorWeakMap.has(this)) {
      return repoEventCtorWeakMap.get(this)!
    }
    class UpdatedEvent extends Event<InferRepo<T>> {}
    repoEventCtorWeakMap.set(this, UpdatedEvent)
    return UpdatedEvent
  }

  static DeletedEvent<T extends AnyRepo>(this: new () => T) {
    if (repoEventCtorWeakMap.has(this)) {
      return repoEventCtorWeakMap.get(this)!
    }
    class DeletedEvent extends Event<InferRepo<T>> {}
    repoEventCtorWeakMap.set(this, DeletedEvent)
    return DeletedEvent
  }

  __type!: {
    [key in Filter<keyof T, this['includes'], this['excludes']> | this['primaryKey']]: key extends keyof T
      ? T[key]
      : never
  }
  abstract primaryKey: FilterKeyField<T>
  __keyType!: this['primaryKey'] extends keyof T ? T[this['primaryKey']] : never
  includes?: readonly (keyof T)[]
  excludes?: readonly (keyof T)[]
}

export interface UserFn {
  <T extends Domain>(DomainCtor: new (context: DomainContext) => T): T
  <T extends AnyRepo>(RepoCtor: new () => T): BoundedRepo<T>
}

export abstract class Domain {
  protected use: UserFn
  constructor(context: DomainContext) {
    this.use = context.use
  }
}

export type DomainContext = {
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
  find(payload: Partial<InferRepo<T>> | RepoQueryFn<T>): T['__type'] | null
  findAll(): T['__type'][]
  findMany(payload: RepoQueryFn<T> | Partial<InferRepo<T>>[]): T['__type'][]
}

export type BoundedRepoMutation<T extends AnyRepo> = {
  add(payload: InferRepo<T>): T['__type']
  addMany(payload: InferRepo<T>): T['__type'][]
  update(payload: UpdateMutationPayload<T> | RepoUpdateMutationFn<T>): T['__type'] | null
  updateMany(payload: RepoUpdateMutationFn<T> | UpdateMutationPayload<T>[]): (T['__type'] | null)[]
  delete(payload: T['__keyType'] | RepoDeleteMutationFn<T>): T['__type'] | null
  deleteMany(payload: RepoDeleteMutationFn<T> | T['__keyType'][]): (T['__type'] | null)[]
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

  @event(TodoRepo.AddedEvent())
  onTodoAdded(event: Todo) {
    console.log('onTodoAdded', event)
  }

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
