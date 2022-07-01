export type Serializable =
  | void
  | undefined
  | number
  | string
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable }
  | readonly Serializable[]
  | { readonly [key: string]: Serializable }

export type OneOrMany<T> = T | T[]

export type AnyCtor<Args extends unknown[] = unknown[], R = unknown> = (new (...args: Args) => R) | (abstract new (...args: Args) => R)

export type StaticProperties<T extends AnyCtor> = Omit<T, 'prototype'>

export type CtorType<T extends AnyCtor> =
  T extends AnyCtor<infer Args, infer R>
  ? (new (...args: Args) => R) & StaticProperties<T>
  : never

export type Prettier<T> = T extends (...args: any[]) => any ? T
  : T extends object ? {
    [key in keyof T]: T[key]
  } : T


export type ExtractType<T, K extends string> = T extends AnyCtor ? ExtractType<InstanceType<T>, K> : 
T extends { [key in (K & keyof T)]: infer U } ? U 
: never

export type ExtractRecordType<T, K extends string> = {
  [key in keyof T]: ExtractType<T[key], K>
}

export type ImplType<T> = ExtractType<T, '__for_impl__'>

export type ImportType<T> = ExtractType<T, '__for_import__'>

export type ExportType<T> = ExtractType<T, '__for_export__'>

export type ImplsType<T> = ExtractRecordType<T, '__for_impl__'>

export type ImportsType<T> = ExtractRecordType<T, '__for_import__'>

export type ExportsType<T> = ExtractRecordType<T, '__for_export__'>

export type Implementable =  AnyCtor<unknown[], {
  __for_impl__: unknown
}>

const implWeakMap = new WeakMap<Implementable, unknown>()

export const impl = <T extends Implementable>(Impl: T, impl: ImplType<T>) => {
  if (implWeakMap.has(Impl)) {
    throw new Error('Cannot implement twice')
  }
  implWeakMap.set(Impl, impl)
}

export abstract class DomainSchema {
  static __tag__: `${string}Ctor` = 'SchemaCtor'
  abstract __tag__: string
  description?: string
}

export type DomainSchemaShape<T extends string = string> =
  ((new () => { __tag__: T }) | (abstract new () => { __tag__: T })) & { __tag__: `${T}Ctor` }

export type DomainConceptCtor<Tag extends string = string> =(new () => { __tag__: Tag }) & { __tag__: `${Tag}Ctor` }

export type SchemaCtorType<T extends DomainSchemaShape> =
  T extends DomainSchemaShape<infer Tag> ?
  DomainConceptCtor<Tag>
  : never

/**
 * top-down input
 */
export abstract class DomainInput<_T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainInputCtor' as const
  __tag__ = 'DomainInput' as const
}

export type DomainInputCtor<T extends Serializable = Serializable> = CtorType<typeof DomainInput<T>>

export type DomainInputReceiverImports = {
  [key: string]: DomainInputCtor<any> | DomainEventCtor<any> | DomainQueryCtor<any, any> | DomainCommandCtor<any, any> | DomainContextCtor
}

export abstract class DomainInputReceiver<T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainInputReceiverCtor' as const
  __tag__ = 'DomainInputReceiver' as const
  abstract Input: DomainInputCtor<T>
  imports: DomainInputReceiverImports = {}
  __for_impl__!: (imports: ImportsType<this['imports']>, input: T) => unknown
}

export type DomainInputReceiverCtor<T extends Serializable = Serializable> = CtorType<typeof DomainInputReceiver<T>>

/**
 * bottom-up event
 */
export abstract class DomainEvent<T = void> extends DomainSchema {
  static __tag__ = 'DomainEventCtor' as const
  __tag__ = 'DomainEvent' as const
  __for_import__!: (event: T) => void
  __for_export__!: (event: T) => void
}

export type DomainEventCtor<T = unknown> = CtorType<typeof DomainEvent<T>>

export type DomainEventHandlerImports = {
  [key: string]: DomainQueryCtor<any, any> | DomainCommandCtor<any, any> | DomainEventCtor<any>
  | DomainContextCtor | DomainInputCtor<any>
}

export abstract class DomainEventHandler<T = void> extends DomainSchema {
  static __tag__ = 'DomainEventHandlerCtor' as const
  __tag__ = 'DomainEventHandler' as const
  abstract trigger: DomainEventCtor<T>
  imports: DomainEventHandlerImports = {}
  __for_impl__!: (imports: ImportsType<this['imports']>, event: T) => unknown
}

export type DomainEventHandlerCtor<T = unknown> = CtorType<typeof DomainEventHandler<T>>

/**
 * top-down context
 */
 export type DomainContextExports = {
  [key: string]:
  | DomainQueryCtor<any, any>
  | DomainCommandCtor<any, any>
  | DomainEventCtor<any>
  | DomainInput<any>
}

export abstract class DomainContext extends DomainSchema {
  static __tag__ = 'DomainContextCtor' as const
  __tag__ = 'DomainContext' as const
  __for_import__!: ImportsType<this['exports']>
  __for_export__!: ExportsType<this['exports']>
  exports: DomainContextExports = {}
}

export type DomainContextCtor = CtorType<typeof DomainContext>
/**
 * domain internal state
 */
export abstract class DomainState<T extends Serializable = void> extends DomainSchema {
  static __tag__ = 'DomainStateCtor' as const
  __tag__ = 'DomainState' as const
  __for_import__!: () => T
  default?: T
  imports?: `'imports' in DomainState is not supported`
  exports?: `'exports' in DomainState is not supported`
  providers?: `'providers' in DomainState is not supported`
  handlers?: `'handlers' in DomainState is not supported`
  receivers?: `'receivers' in DomainState is not supported`
}

export type DomainStateCtor<T extends Serializable = Serializable> = CtorType<typeof DomainState<T>>

export abstract class DomainStateGetter<T extends Serializable = Serializable> extends DomainSchema {
  static __tag__ = 'DomainStateGetterCtor' as const
  __tag__ = 'DomainStateGetter' as const
  __for_import__!: () => T
  abstract State: DomainStateCtor<T>
}

export type DomainStateGetterCtor<T extends Serializable = Serializable> = CtorType<typeof DomainStateGetter<T>>

const getStateWeakMap = new WeakMap<DomainStateCtor, DomainStateGetterCtor>()

export const Get = <T extends Serializable>(State: DomainStateCtor<T>): CtorType<typeof DomainStateGetter<T>> => {
  if (getStateWeakMap.has(State)) {
    return getStateWeakMap.get(State)! as CtorType<typeof DomainStateGetter<T>>
  }
  
  class StateGetter extends DomainStateGetter<T> {
    State = State
  }

  getStateWeakMap.set(State, StateGetter)

  return StateGetter
}

export abstract class DomainStateSetter<T extends Serializable = Serializable> extends DomainSchema {
  static __tag__ = 'DomainStateSetterCtor' as const
  __tag__ = 'DomainStateSetter' as const
  __for_import__(newState: T): void {
    throw new Error('not implemented')
  }
  abstract State: DomainStateCtor<T>
}

export type DomainStateSetterCtor<T extends Serializable = Serializable> = CtorType<typeof DomainStateSetter<T>>

const setStateWeakMap = new WeakMap<DomainStateCtor, DomainStateSetterCtor>()

export const Set = <T extends Serializable>(State: DomainStateCtor<T>): DomainStateSetterCtor<T> => {
  if (setStateWeakMap.has(State)) {
    return setStateWeakMap.get(State)! as DomainStateSetterCtor<T>
  }

  class StateSetter extends DomainStateSetter<T> {
    State = State
  }

  setStateWeakMap.set(State, StateSetter)

  return StateSetter
}

export type DomainQueryImports = {
  [key: string]: SchemaCtorType<DomainStateGetterCtor<any> | DomainQueryCtor<any, any> | DomainContextCtor>
}

abstract class DomainQuery<I extends Serializable, O> extends DomainSchema {
  static __tag__ = 'DomainQueryCtor' as const
  __tag__ = 'DomainQuery' as const
  imports: DomainQueryImports = {}
  __for_import__!: (input: I) => O
  __for_export__!: (input: I) => O
  __for_impl__(imports: ImportsType<this['imports']>, input: I): O {
    throw new Error('no impl')
  }
}

type DomainQueryCtor<I extends Serializable = Serializable, O = unknown> = CtorType<typeof DomainQuery<I, O>>

export type DomainCommandImports = {
  [key: string]: SchemaCtorType<
    | DomainStateGetterCtor<any>
    | DomainStateSetterCtor<any>
    | DomainQueryCtor<any, any>
    | DomainCommandCtor<any, any>
    | DomainEventCtor<any>
    | DomainInputCtor<any>
    | DomainContextCtor
    >
}

abstract class DomainCommand<I = void, O = void> extends DomainSchema {
  static __tag__ = 'DomainCommandCtor' as const
  __tag__ = 'DomainCommand' as const
  imports: DomainCommandImports = {}
  __for_import__(input: I): O {
    throw new Error('not implemented')
  }
  __for_export__(input: I): O {
    throw new Error('not implemented')
  }
  __for_impl__(imports: ImportsType<this['imports']>, input: I): O {
    throw new Error('not implemented')
  }
}

type DomainCommandCtor<I = unknown, O = unknown> = CtorType<typeof DomainCommand<I, O>>

abstract class CommandCalledEvent<T extends DomainCommandCtor> extends DomainEvent<T extends DomainCommandCtor<infer I, unknown> ? I : never> {
  abstract Command: T
}

type CommandCalledEventCtor<T extends DomainCommandCtor> = CtorType<typeof CommandCalledEvent<T>>

const calledEventWeakMap = new WeakMap<DomainCommandCtor<any, any>, CommandCalledEventCtor<any>>()

export const Called = <T extends DomainCommandCtor>(Command: T): CommandCalledEventCtor<T> => {
  if (calledEventWeakMap.has(Command)) {
    return calledEventWeakMap.get(Command)!
  }

  return class CalledEvent extends CommandCalledEvent<T> {
    Command = Command
  }
}

export type DomainEffectImports = {
  [key: string]: SchemaCtorType<
    | DomainQueryCtor<any, any> 
    | DomainCommandCtor<any, any> 
    | DomainContextCtor 
    | DomainEventCtor<any> 
    | DomainInputCtor<any>
  >
}

export abstract class DomainEffect extends DomainSchema {
  static __tag__ = 'DomainEffectCtor' as const
  __tag__ = 'DomainEffect' as const
  imports: DomainEffectImports = {}
  __for_impl__!: (imports: ImportsType<this['imports']>) => () => void
}

export type DomainEffectCtor = CtorType<typeof DomainEffect>

export type DomainExport = DomainQueryCtor<any, any> | DomainCommandCtor<any, any> | DomainEventCtor<any> | DomainInputCtor<any>

export type DomainExports = {
  [key: string]: SchemaCtorType<DomainExport>
}


abstract class Domain extends DomainSchema {
  static __tag__ = 'DomainCtor' as const
  __tag__ = 'Domain' as const
  __for_export__!: Prettier<ExportsType<this['exports']>>
  abstract exports: DomainExports
  effects: DomainEffectCtor[] = []
  providers: DomainContextCtor[] = []
  handlers: DomainEventHandlerCtor[] = []
  receivers: DomainInputReceiverCtor[] = []
}

export type DomainCtor = CtorType<typeof Domain>

type AnyDomainCtor = SchemaCtorType<DomainCtor | UnionDomainCtor | StructDomainCtor>

type DomainTransitionTrigger = DomainInputCtor<any> | DomainEventCtor<any>

export type DomainTransitionImports = {
  [key: string]: SchemaCtorType<DomainStateCtor<any> | DomainQueryCtor<any> | DomainContextCtor>
}

export abstract class DomainTransitionGuard extends DomainSchema {
  static __tag__ = 'DomainTransitionGuardCtor' as const
  __tag__ = 'DomainTransitionGuard' as const
  imports: DomainTransitionImports = {}
  __for_impl__(imports: ImportsType<this['imports']>): boolean | Promise<boolean> {
    throw new Error('not implemented')
  }
}

export type DomainTransitionGuardCtor = CtorType<typeof DomainTransitionGuard>

export type DomainTransitionConfig = {
  scope?: OneOrMany<AnyDomainCtor>
  guard?: DomainTransitionGuardCtor
  trigger: OneOrMany<DomainTransitionTrigger>
  target: AnyDomainCtor
}

abstract class UnionDomain extends DomainSchema {
  static __tag__ = 'UnionDomainCtor' as const
  __tag__ = 'UnionDomain' as const
  __for_export__!: ExportType<this['initial'] | this['transitions'][number]['target']>
  abstract initial: AnyDomainCtor
  abstract transitions: DomainTransitionConfig[]
  effects: DomainEffectCtor[] = []
  providers: DomainContextCtor[] = []
  handlers: DomainEventHandlerCtor[] = []
  receivers: DomainInputReceiverCtor[] = []
  default?: `'default' is not allowed in UnionDomain, use 'initial' instead`
  imports?: `'imports' in UnionDomain is not supported`
  exports?: `'exports' in UnionDomain is not supported`
}

type UnionDomainCtor = CtorType<typeof UnionDomain>

type StructDomainExports = {
  [key: string]: AnyDomainCtor
}

abstract class StructDomain extends DomainSchema {
  static __tag__ = 'StructDomainCtor' as const
  __tag__ = 'StructDomain' as const
  __for_export__!: Prettier<ExportsType<this['exports']>>
  exports: StructDomainExports = {}
  effects: DomainEffectCtor[] = []
  providers: DomainContextCtor[] = []
  handlers: DomainEventHandlerCtor[] = []
  receivers: DomainInputReceiverCtor[] = []
  imports?: `'imports' in UnionDomain is not supported`
}

type StructDomainCtor = CtorType<typeof StructDomain>

type EyeStateType = 'blue' | 'red' | 'blown' | 'violet' | {
  type: 'pick',
  color: string
}

class EyeState extends DomainState<EyeStateType> {
  default = 'blue' as const
}

class SwitchCustomColor extends DomainCommand<string> {
  imports = {
    getEyeState: Get(EyeState),
    setEyeState: Set(EyeState)
  }
}

impl(SwitchCustomColor, ({ getEyeState, setEyeState }, arg) => {
  const eye = getEyeState()
})

class ChangeColorPicker extends DomainCommand {
  imports = {
    getEyeState: Get(EyeState),
    setEyeState: Set(EyeState)
  }
}

class NextColor extends DomainCommand {
  imports = {
    getEyeState: Get(EyeState),
    setEyeState: Set(EyeState)
  }
}

class EyeBlue extends Domain {
  exports = {
    nextColor: NextColor,
  };
}

class EyeGreen extends Domain {
  exports = {
    nextColor: NextColor,
  };
}

class EyeBrown extends Domain {
  exports = {
    nextColor: NextColor,
  };
}

class EyeViolet extends Domain {
  exports = {
    nextColor: NextColor,
  };
}

class EyePick extends Domain {
  exports = {
    changeColorPicker: ChangeColorPicker,
    switchCustomColor: SwitchCustomColor,
  };
}

class EyeColor extends UnionDomain {
  initial = EyeBlue;

  transitions = [
    {
      scope: EyeBlue,
      target: EyeGreen,
      trigger: Called(NextColor),
    },
    {
      scope: EyeGreen,
      target: EyeBrown,
      trigger: Called(NextColor),
    },
    {
      scope: EyeBrown,
      target: EyeViolet,
      trigger: Called(NextColor),
    },
    {
      scope: EyeViolet,
      target: EyeBlue,
      trigger: Called(NextColor),
    },
    {
      scope: EyeColor,
      target: EyePick,
      trigger: Called(SwitchCustomColor),
    },
    {
      scope: EyePick,
      target: EyeBlue,
      trigger: Called(SwitchCustomColor),
    }
  ];
}

type T3 = ExportType<EyeColor['initial'] | EyeColor['transitions'][number]['target']>

type T0 = ExportType<EyeColor>

type T2 = 123 extends AnyCtor ? true : false


class NextHair extends DomainCommand { }

class ChangeHairDark extends DomainCommand { }

class ChangeHairRed extends DomainCommand { }

class ChangeHairWhite extends DomainCommand { }

class ChangeHairLength extends DomainCommand { }

class HairStyle1 extends Domain {
  exports = {
    nextHair: NextHair,
  }
}

class HairStyle2 extends Domain {
  exports = {
    nextHair: NextHair,
  }
}

class HairStyle3 extends Domain {
  exports = {
    nextHair: NextHair,
  }
}

class HairStyle extends UnionDomain {
  initial = HairStyle1;

  transitions = [
    {
      scope: HairStyle1,
      target: HairStyle2,
      trigger: Called(NextHair),
    },

    {
      scope: HairStyle2,
      target: HairStyle3,
      trigger: Called(NextHair),
    },

    {
      scope: HairStyle3,
      target: HairStyle1,
      trigger: Called(NextHair),
    },
  ]
}

class HairColor extends Domain {
  exports = {
    changeHairDark: ChangeHairDark,
    changeHairRed: ChangeHairRed,
    changeHairWhite: ChangeHairWhite,
  }
}

class HairLength extends Domain {
  exports = {
    changeHairLength: ChangeHairLength,
  }
}

class Hair extends StructDomain {
  exports = {
    hairStyle: HairStyle,
    hairColor: HairColor,
  }
}

class CharacterEditor extends StructDomain {
  exports = {
    eye: EyeColor,
    hair: Hair,
  }
}


type T5 = ExportType<CharacterEditor>

type GameStateType = {
  time: number
  total_time: number
  trial_number: number
}

class GameState extends DomainState<GameStateType> {
  description = 'Game state for Reflex state'
  default = {
    time: 0,
    total_time: 0,
    trial_number: 0,
  }
}

class Coin extends DomainCommand<number> {
  description = 'Coin command for Reflex Game'
  imports = {
    getGameState: Get(GameState)
  }
}

class Noop extends DomainCommand {
  description = 'Noop command for Reflex Game'
}

class Ready extends DomainCommand {
  description = 'Ready command for Reflex Game'
}

class Warn extends DomainCommand {
  description = 'Warn command for Reflex Game'
}

class Timeout extends DomainCommand {
  description = 'Timeout command for Reflex Game'
}

class Tick extends DomainCommand {
  description = 'Tick command for Reflex Game'
}

class Renew extends DomainCommand {
  description = 'Renew command for Reflex Game'
}

class Abort extends DomainCommand {
  description = 'Abort command for Reflex Game'
}

class Go extends DomainCommand {
  description = 'Go command for Reflex Game'
}

class React extends DomainCommand {
  description = 'React command for Reflex Game'
}

class Tock extends DomainCommand {
  description = 'Tock command for Reflex Game'
}

class Finish extends DomainCommand {
  description = 'Finish command for Reflex Game'
}

class Reveal extends DomainQuery<void, GameState> {
  description = 'Reveal query for Reflex Game'
}

class ReflexQuiet extends Domain {
  exports = {
    coin: Coin,
    noop: Noop,
  }
}

class ReflexStart extends Domain {
  exports = {
    reveal: Reveal,
    ready: Ready,
    renew: Renew,
    warn: Warn,
    timeout: Timeout,
    tick: Tick,
  }
}

class ReflexWait extends Domain {
  exports = {
    reveal: Reveal,
    renew: Renew,
    warn: Warn,
    abort: Abort,
    tick: Tick,
    go: Go
  }
}

class ReflexReact extends Domain {
  exports = {
    reveal: Reveal,
    react: React,
    renew: Renew,
    warn: Warn,
    tick: Tick,
    timeout: Timeout
  }
}

class ReflexEnd extends Domain {
  exports = {
    reveal: Reveal,
    warn: Warn,
    renew: Renew,
    tick: Tick,
    tock: Tock,
    finish: Finish
  }
}


class ReflexGame extends UnionDomain {
  initial = ReflexQuiet

  transitions = [
    {
      trigger: Called(Noop),
      target: ReflexQuiet
    },
    {
      trigger: Called(Coin),
      target: ReflexStart
    },
    {
      trigger: Called(Ready),
      target: ReflexWait
    },
    {
      trigger: Called(Renew),
      target: ReflexStart
    },
    {
      trigger: Called(Timeout),
      target: ReflexQuiet
    },
    {
      trigger: Called(Abort),
      target: ReflexQuiet
    },
    {
      trigger: Called(Go),
      target: ReflexQuiet
    },
    {
      trigger: Called(Finish),
      target: ReflexQuiet
    },
    {
      trigger: Called(Tock),
      target: ReflexStart
    },
    {
      scope: ReflexStart,
      trigger: Called(Warn),
      target: ReflexStart,
    },
    {
      scope: ReflexWait,
      trigger: Called(Warn),
      target: ReflexWait,
    },
    {
      scope: ReflexReact,
      trigger: Called(Warn),
      target: ReflexReact,
    },
    {
      scope: ReflexEnd,
      trigger: Called(Warn),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: Called(Tick),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: Called(Tick),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: Called(Tick),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: Called(Tick),
      target: ReflexEnd,
    }
  ]
}

type T4 = ExportType<ReflexGame>