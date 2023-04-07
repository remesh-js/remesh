const schemaCtorCache = new WeakMap<SchemaCtor, SchemaCtor>()

const withCache = <T extends (input: SchemaCtor) => SchemaCtor>(fn: T): T => {
  return ((input) => {
    if (schemaCtorCache.has(input)) {
      return schemaCtorCache.get(input)!
    }
    const output = fn(input)
    schemaCtorCache.set(input, output)
    return output
  }) as T
}

type Union2Intersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export abstract class Schema {
  abstract __data_type__: unknown
  abstract __query_type__: unknown
  abstract __mutation_type__: unknown
}

export type SchemaCtor<T extends Schema = Schema> = new () => T

export type InferData<T> = T extends SchemaCtor<infer S> | infer S ? S['__data_type__'] : never

export type InferQuery<T> = T extends SchemaCtor<infer S> | infer S ? S['__query_type__'] : never

export type InferMutation<T> = T extends SchemaCtor<infer S> | infer S ? S['__mutation_type__'] : never

export type EntityQuery<T extends Entity = Entity, Query = unknown> = {
  Entity: SchemaCtor<T>
  query: Query | ((data: T['__data_type__']) => boolean)
}

export type EntityMutation<T extends Entity = Entity, Mutation = unknown> = {
  Entity: SchemaCtor<T>
  mutation: Mutation | ((data: T['__data_type__']) => T['__data_type__'])
}

export abstract class Entity extends Schema {
  static query<T extends Entity>(this: SchemaCtor<T>, query: T['__query_type__']['query']): T['__query_type__'] {
    return {
      Entity: this,
      query,
    }
  }
  static mutation<T extends Entity>(
    this: SchemaCtor<T>,
    mutation: T['__mutation_type__']['mutation'],
  ): T['__mutation_type__'] {
    return {
      Entity: this,
      mutation,
    }
  }
  __entity_schema__ = true as const
  abstract __query_type__: EntityQuery<any, any>
  abstract __mutation_type__: EntityMutation<any, any>
}

export abstract class Scalar extends Schema {
  __query_type__!: this['__data_type__']
  __mutation_type__!: this['__data_type__']
}

export class Type<T> extends Scalar {
  __data_type__!: T
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

export class Json extends Scalar {
  __json_type__ = true as const
  __data_type__!: JsonData
}

export class Str extends Scalar {
  __data_type__!: string
}

export class Num extends Scalar {
  __data_type__!: number
}

export class Bool extends Scalar {
  __data_type__!: boolean
}

export abstract class AbstractLiteral extends Scalar {
  __data_type__!: this['value']
  abstract value: string | number | boolean | null
}

export const Literal = <T extends string | number | boolean | null>(value: T) => {
  return class Literal extends AbstractLiteral {
    value = value
  }
}

export abstract class AbstractList extends Entity {
  __list_type__ = true as const
  __data_type__!: InferData<this['item']>[]
  __query_type__!: EntityQuery<this, InferQuery<this['item']>>
  __mutation_type__!: EntityMutation<this, this['__data_type__']>
  abstract item: SchemaCtor
}

export const List = withCache(<T extends SchemaCtor>(item: T) => {
  return class List extends AbstractList {
    item = item
  }
})

export abstract class AbstractOptional extends Entity {
  __optional_type__ = true as const
  __data_type__!: InferData<this['item']> | undefined
  __query_type__!: EntityQuery<this, InferQuery<this['item']> | undefined>
  __mutation_type__!: EntityMutation<this, this['__data_type__']>
  abstract item: SchemaCtor
}

export const Optional = withCache(<T extends SchemaCtor>(item: T) => {
  return class Optional extends AbstractOptional {
    item = item
  }
})

export abstract class AbstractNullable extends Entity {
  __nullable_type__ = true as const
  __data_type__!: InferData<this['item']> | null
  __query_type__!: EntityQuery<this, InferQuery<this['item']> | null>
  __mutation_type__!: EntityMutation<this, this['__data_type__']>
  abstract item: SchemaCtor
}

export const Nullable = withCache(<T extends SchemaCtor>(item: T) => {
  return class Nullable extends AbstractNullable {
    item = item
  }
})

export type SchemaCtorField<T extends object, key extends keyof T> = key extends `__${string}`
  ? never
  : T[key] extends undefined
  ? never
  : T[key] extends SchemaCtor | undefined
  ? key
  : never

export abstract class Struct extends Entity {
  __struct_type__ = true as const
  __data_type__!: {
    [key in keyof this as SchemaCtorField<this, key>]: InferData<this[key]>
  }
  __query_type__!: EntityQuery<
    this,
    {
      [key in keyof this as SchemaCtorField<this, key>]?: InferQuery<this[key]>
    }
  >
  __mutation_type__!: EntityMutation<
    this,
    {
      [key in keyof this as SchemaCtorField<this, key>]?: InferMutation<this[key]>
    }
  >
}

export abstract class AbstractUnion extends Entity {
  __union_type__ = true as const
  __data_type__!: InferData<this['items'][number]>
  __query_type__!: EntityQuery<this, InferQuery<this['items'][number]>>
  __mutation_type__!: EntityMutation<this, this['__data_type__']>
  abstract items: SchemaCtor[]
}

export const Union = <T extends SchemaCtor[]>(...items: T) => {
  return class Union extends AbstractUnion {
    items = items
  }
}

type Prettier<T> = {
  [key in keyof T]: T[key]
}

export abstract class AbstractIntersection extends Entity {
  __intersection_type__ = true as const
  __data_type__!: Prettier<Union2Intersection<InferData<this['items'][number]>>>
  __query_type__!: EntityQuery<this, Union2Intersection<InferQuery<this['items'][number]>>>
  __mutation_type__!: EntityMutation<this, Partial<Union2Intersection<InferMutation<this['items'][number]>>>>
  abstract items: SchemaCtor[]
}

export const Intersection = <T extends SchemaCtor[]>(...items: T) => {
  return class Intersection extends AbstractIntersection {
    items = items
  }
}
