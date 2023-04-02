type Split<T extends string> = T extends `${infer Char}${infer Rest}` ? Char | Split<Rest> : never

type UpperLetter = Split<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>

export type Capital = `${UpperLetter}${string}`

type Union2Intersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export abstract class Schema {
  abstract __data_type__: unknown
  abstract __query_type__: unknown
  abstract __update_type__: unknown
}

export type SchemaCtor<T extends Schema = Schema> = new () => T

export type InferData<T> = T extends SchemaCtor<infer S> | infer S ? S['__data_type__'] : never

export type InferQuery<T> = T extends SchemaCtor<infer S> | infer S ? S['__query_type__'] : never

export type InferUpdate<T> = T extends SchemaCtor<infer S> | infer S ? S['__update_type__'] : never

export class Type<T> extends Schema {
  __data_type__!: T
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
}

export type JsonData =
  | string
  | number
  | boolean
  | null
  | JsonData[]
  | {
      [key: string]: JsonData
    }

export const Json = Type<JsonData>

export class Str extends Schema {
  __data_type__!: string
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
}

export class Num extends Schema {
  __data_type__!: number
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
}

export class Int extends Schema {
  __data_type__!: number
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
}

export class Float extends Schema {
  __data_type__!: number
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
}

export class Bool extends Schema {
  __data_type__!: boolean
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
}

export abstract class AbstractLiteral extends Schema {
  __data_type__!: this['value']
  __query_type__!: this['__data_type__']
  __update_type__!: this['__data_type__']
  abstract value: string | number | boolean | null
}

export const Literal = <T extends string | number | boolean | null>(value: T) => {
  return class Literal extends AbstractLiteral {
    value = value
  }
}

export abstract class AbstractList extends Schema {
  __data_type__!: InferData<this['item']>[]
  __query_type__!: InferQuery<this['item']>
  __update_type__!: this['__data_type__']
  abstract item: SchemaCtor
}

export const List = <T extends SchemaCtor>(item: T) => {
  return class List extends AbstractList {
    item = item
  }
}

export abstract class AbstractOptional extends Schema {
  __data_type__!: InferData<this['item']> | undefined
  __query_type__!: InferQuery<this['item']> | undefined
  __update_type__!: this['__data_type__']
  abstract item: SchemaCtor
}

export const Optional = <T extends SchemaCtor>(item: T) => {
  return class Optional extends AbstractOptional {
    item = item
  }
}

export type SchemaCtorField<T extends object, key extends keyof T> = key extends `__${string}`
  ? never
  : T[key] extends undefined
  ? never
  : T[key] extends SchemaCtor | undefined
  ? key
  : never

export abstract class Struct extends Schema {
  __data_type__!: {
    [key in keyof this as SchemaCtorField<this, key>]: InferData<this[key]>
  }
  __query_type__!: {
    [key in keyof this as SchemaCtorField<this, key>]?: InferQuery<this[key]>
  }
  __update_type__!: Partial<this['__data_type__']>
}

export abstract class AbstractUnion extends Schema {
  __data_type__!: InferData<this['items'][number]>
  __query_type__!: InferQuery<this['items'][number]>
  __update_type__!: this['__data_type__']
  abstract items: SchemaCtor[]
}

export const Union = <T extends SchemaCtor[]>(...items: T) => {
  return class Union extends AbstractUnion {
    items = items
  }
}

export abstract class AbstractIntersection extends Schema {
  __data_type__!: Union2Intersection<InferData<this['items'][number]>>
  __query_type__!: Union2Intersection<InferQuery<this['items'][number]>>
  __update_type__!: Partial<this['__data_type__']>
  abstract items: SchemaCtor[]
}

export const Intersection = <T extends SchemaCtor[]>(...items: T) => {
  return class Intersection extends AbstractIntersection {
    items = items
  }
}

export type Prettier<T> = {
  [key in keyof T]: T[key]
}

const Null = Literal(null)

export const Nullable = <T extends SchemaCtor>(Item: T) => {
  return Union(Item, Null)
}

class Todo extends Struct {
  id = Int
  content = Str
  completed = Bool
}

const TodoList = List(Todo)

const TodoFilter = Union(Literal('active'), Literal('all'), Literal('completed'))

class TodoApp extends Struct {
  todos = TodoList
  filter = TodoFilter
  input = Str
}

type TodoAppData = InferData<TodoApp>
type TodoAppQuery = InferQuery<TodoApp>
type TodoAppUpdate = InferUpdate<TodoApp>

class Tree extends Struct {
  value = Num
  children = List(Tree)
}

type TreeData = InferData<Tree>
type TreeQuery = InferQuery<Tree>
type TreeUpdate = InferUpdate<Tree>

class LinkedList extends Struct {
  value = Num
  next? = Optional(LinkedList)
}

type LinkedListData = InferData<LinkedList>
type LinkedListQuery = InferQuery<LinkedList>
type LinkedListUpdate = InferUpdate<LinkedList>

class Category extends Struct {
  name = Str
  subcategories = List(Category)
}

type CategoryData = InferData<Category>
type CategoryQuery = InferQuery<Category>
type CategoryUpdate = InferUpdate<Category>

const data: CategoryData = {
  name: 'People',
  subcategories: [
    {
      name: 'Politicians',
      subcategories: [
        {
          name: 'Presidents',
          subcategories: [],
        },
      ],
    },
  ],
}
