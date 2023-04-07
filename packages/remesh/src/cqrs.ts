import { Entity, EntityMutation, EntityQuery } from './schema'
import { Serializable } from './serializable'

export type Context = {
  get<T extends Entity>(query: EntityQuery<T>): T['__data_type__'] | void
  assert<T extends Entity>(query: EntityQuery<T>): T['__data_type__']
  set<T extends Entity>(mutation: EntityMutation): T['__data_type__']
}

export type QueryContext = Pick<Context, 'get' | 'assert'>

export abstract class Query {
  get: QueryContext['get']
  assert: QueryContext['assert']
  constructor(context: QueryContext) {
    this.get = context.get
    this.assert = context.assert
  }
  abstract impl(input: Serializable): unknown
}

export type CommandContext = Pick<Context, 'get' | 'assert' | 'set'>

export abstract class Command {
  get: CommandContext['get']
  assert: CommandContext['assert']
  set: CommandContext['set']
  constructor(context: CommandContext) {
    this.get = context.get
    this.assert = context.assert
    this.set = context.set
  }
  abstract impl(...args: unknown[]): unknown
}
