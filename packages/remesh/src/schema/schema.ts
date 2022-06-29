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

export type CtorTypeOf<T extends AnyCtor> =
  T extends AnyCtor<infer Args, infer R>
  ? (new (...args: Args) => R) & StaticProperties<T>
  : never

export type Prettier<T> = T extends (...args: any[]) => any ? T
  : T extends object ? {
    [key in keyof T]: T[key]
  } : T


export abstract class DomainSchema {
  static __tag__: `${string}Ctor` = 'SchemaCtor'
  abstract __tag__: string
  __type__: unknown
  description?: string
}

export type DomainSchemaCtor = CtorTypeOf<typeof DomainSchema>

export abstract class DomainArg<T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainArgCtor' as const
  __tag__ = 'DomainArg' as const
  __type__!: T
  default?: T
}

type DomainArgCtor<T extends Serializable = Serializable> = CtorTypeOf<typeof DomainArg<T>>

export abstract class DomainOptionalArg<T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainOptionalArgCtor' as const
  __tag__ = 'DomainOptionalArg' as const
  abstract Arg: DomainArgCtor<T>
  default?: T
}

type DomainOptionalArgCtor<T extends Serializable = Serializable> = CtorTypeOf<typeof DomainOptionalArg<T>>

export abstract class DomainArgList<T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainArgListCtor' as const
  __tag__ = 'DomainArgList' as const
  abstract Arg: DomainArgCtor<T>
  default: T[] = []
}

type DomainArgListCtor<T extends Serializable = Serializable> = CtorTypeOf<typeof DomainArgList<T>>

export abstract class DomainArgProvider<T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainArgProviderCtor' as const
  __tag__ = 'DomainArgProvider' as const
  abstract Arg: DomainArgCtor<T>
  default?: T
}

type DomainArgProviderCtor<T extends Serializable = Serializable> = CtorTypeOf<typeof DomainArgProvider<T>>

/**
 * top-down input
 */
export abstract class DomainInput<T extends Serializable> extends DomainSchema {
  static __tag__ = 'DomainInputCtor' as const
  __tag__ = 'DomainInput' as const
  __type__!: T
}

export type DomainInputCtor<T extends Serializable = Serializable> = CtorTypeOf<typeof DomainInput<T>>

/**
 * bottom-up event
 */
export abstract class DomainEvent<T = void> extends DomainSchema {
  static __tag__ = 'DomainEventCtor' as const
  __tag__ = 'DomainEvent' as const
  __type__!: T
}

export type DomainEventCtor<T = unknown> = CtorTypeOf<typeof DomainEvent<T>>

export type DomainEventHandlerImports = {
  [key: string]: DomainStateCtor | DomainQueryCtor | DomainCommandCtor | DomainEventCtor | DomainArgCtor | DomainArgProviderCtor
  | AnyDomainCtor | DomainContextCtor
}

export abstract class DomainEventHandler<T = void> extends DomainSchema {
  static __tag__ = 'DomainEventHandlerCtor' as const
  __tag__ = 'DomainEventHandler' as const
  abstract trigger: DomainEventCtor<T>
  imports: DomainEventHandlerImports = {}
}

type DomainEventHandlerCtor<T = unknown> = CtorTypeOf<typeof DomainEventHandler<T>>

/**
 * top-down context
 */
export abstract class DomainContext<T> extends DomainSchema {
  static __tag__ = 'DomainContextCtor' as const
  __tag__ = 'DomainContext' as const
  __type__!: T
  default?: T
}

export type DomainContextCtor<T = unknown> = CtorTypeOf<typeof DomainContext<T>>

export type DomainContextProviderImports = {
  [key: string]:
  | DomainStateCtor
  | DomainQueryCtor
  | DomainCommandCtor
  | DomainEventCtor
  | DomainArgCtor
  | DomainArgProviderCtor
  | AnyDomainCtor
  | DomainContextCtor
}

export abstract class DomainContextProvider<T> extends DomainSchema {
  static __tag__ = 'DomainContextProviderCtor' as const
  __tag__ = 'DomainContextProvider' as const
  abstract Context: DomainContextCtor
  imports: DomainContextProviderImports = {}
  default?: T
}

export type DomainContextProviderCtor<T = unknown> = CtorTypeOf<typeof DomainContextProvider<T>>

/**
 * domain internal state
 */
abstract class DomainState<T extends Serializable = void> extends DomainSchema {
  static __tag__ = 'DomainStateCtor' as const
  __tag__ = 'DomainState' as const
  __type__!: T
  default?: T
  imports?: `'imports' in DomainState is not supported`
  exports?: `'exports' in DomainState is not supported`
  providers?: `'providers' in DomainState is not supported`
  handlers?: `'handlers' in DomainState is not supported`
}

type DomainStateCtor<T extends Serializable = Serializable> = CtorTypeOf<typeof DomainState<T>>


export type DomainQueryImports = {
  [key: string]: DomainStateCtor | DomainQueryCtor | DomainContextCtor | DomainArgCtor | AnyDomainCtor
}

abstract class DomainQuery<I extends Serializable, O> extends DomainSchema {
  static __tag__ = 'DomainQueryCtor' as const
  __tag__ = 'DomainQuery' as const
  __type__!: {
    input: I
    output: O
  }
  imports: DomainQueryImports = {}
}

type DomainQueryCtor<I extends Serializable = Serializable, O = unknown> = CtorTypeOf<typeof DomainQuery<I, O>>

export type DomainCommandImports = {
  [key: string]:
  | DomainStateCtor
  | DomainQueryCtor
  | DomainCommandCtor
  | DomainContextCtor
  | DomainArgCtor
  | AnyDomainCtor
  | DomainEventCtor
  | DomainArgProviderCtor
}

abstract class DomainCommand<I = void, O = void> extends DomainSchema {
  static __tag__ = 'DomainCommandCtor' as const
  __tag__ = 'DomainCommand' as const
  __type__!: {
    input: I
    output: O
  }
  imports: DomainCommandImports = {}
}

type DomainCommandCtor<I = unknown, O = unknown> = CtorTypeOf<typeof DomainCommand<I, O>>


abstract class CommandCalledEvent<I, O> extends DomainEvent<I> {
  abstract Command: DomainCommandCtor<I, O>
}

type CommandCalledEventCtor<I = unknown, O = unknown> = CtorTypeOf<typeof CommandCalledEvent<I, O>>

const calledEventWeakMap = new WeakMap<DomainCommandCtor, CommandCalledEventCtor>()

export const CommandCalled = <I, O>(Command: DomainCommandCtor<I, O>) => {
  if (calledEventWeakMap.has(Command)) {
    return calledEventWeakMap.get(Command)! as CommandCalledEventCtor<I, O>
  }

  return class CalledEvent extends CommandCalledEvent<I, O> {
    Command = Command
  }
}


type DomainExports = AnyDomainCtor | {
  [key: string]: DomainQueryCtor | DomainCommandCtor | DomainEventCtor
}

abstract class Domain extends DomainSchema {
  static __tag__ = 'DomainCtor' as const
  __tag__ = 'Domain' as const
  providers: DomainContextProviderCtor[] = []
  handlers: DomainEventHandlerCtor[] = []
  arg?: DomainArgCtor
  abstract exports: OneOrMany<DomainExports>
}

type DomainCtor = CtorTypeOf<typeof Domain>

export abstract class OptionalDomain extends DomainSchema {
  static __tag__ = 'OptionalDomainCtor' as const
  __tag__ = 'OptionalDomain' as const
  abstract Domain: AnyDomainCtor
}

type OptionalDomainCtor = CtorTypeOf<typeof OptionalDomain>

export abstract class ListDomain extends DomainSchema {
  static __tag__ = 'ListDomainCtor' as const
  __tag__ = 'ListDomain' as const
  abstract Domain: AnyDomainCtor
}

type ListDomainCtor = CtorTypeOf<typeof ListDomain>

type AnyDomainCtor = DomainCtor | UnionDomainCtor | StructDomainCtor | OptionalDomainCtor | ListDomainCtor

type DomainTransitionTrigger = DomainInputCtor | DomainEventCtor

export type DomainTransitionImports = {
  [key: string]: DomainStateCtor | DomainQueryCtor | DomainCommandCtor | DomainEventCtor | DomainArgCtor | DomainArgProviderCtor | AnyDomainCtor | DomainContextCtor
}

abstract class DomainTransition extends DomainSchema {
  static __tag__ = 'DomainTransitionCtor' as const
  __tag__ = 'DomainTransition' as const
  scope?: OneOrMany<AnyDomainCtor>
  abstract trigger: DomainTransitionTrigger | DomainTransitionTrigger[]
  abstract target: AnyDomainCtor
  imports: DomainTransitionImports = {}
}

type DomainTransitionCtor = CtorTypeOf<typeof DomainTransition>

type DomainTransitionConfig = {
  scope?: OneOrMany<AnyDomainCtor>
  trigger: DomainTransitionTrigger | DomainTransitionTrigger[]
  target: AnyDomainCtor
}

abstract class UnionDomain extends DomainSchema {
  static __tag__ = 'UnionDomainCtor' as const
  __tag__ = 'UnionDomain' as const
  default?: `'default' is not allowed in UnionDomain, use 'initial' instead`
  abstract initial: AnyDomainCtor
  abstract transitions: (DomainTransitionCtor | DomainTransitionConfig)[]
  imports?: `'imports' in UnionDomain is not supported`
  exports?: `'exports' in UnionDomain is not supported`
  providers?: `'providers' in UnionDomain is not supported`
  handlers?: `'handlers' in UnionDomain is not supported`
}

type UnionDomainCtor = CtorTypeOf<typeof UnionDomain>

type StructDomainExports = {
  [key: string]: AnyDomainCtor
}

abstract class StructDomain extends DomainSchema {
  static __tag__ = 'StructDomainCtor' as const
  __tag__ = 'StructDomain' as const
  exports: StructDomainExports = {}
  imports?: `'imports' in UnionDomain is not supported`
  providers?: `'providers' in UnionDomain is not supported`
  handlers?: `'handlers' in UnionDomain is not supported`
}

type StructDomainCtor = CtorTypeOf<typeof StructDomain>


class EyeState extends DomainState {}

class SwitchCustomColor extends DomainCommand {
  imports = {
    EyeState
  }
}

class ChangeColorPicker extends DomainCommand {
  imports = {
    EyeState
  }
}

class NextColor extends DomainCommand {
  imports = {
    EyeState
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
      trigger: CommandCalled(NextColor),
    },
    {
      scope: EyeGreen,
      target: EyeBrown,
      trigger: CommandCalled(NextColor),
    },
    {
      scope: EyeBrown,
      target: EyeViolet,
      trigger: CommandCalled(NextColor),
    },
    {
      scope: EyeViolet,
      target: EyeBlue,
      trigger: CommandCalled(NextColor),
    },
    {
      scope: EyeColor,
      target: EyePick,
      trigger: CommandCalled(SwitchCustomColor),
    },
    {
      scope: EyePick,
      target: EyeBlue,
      trigger: CommandCalled(SwitchCustomColor),
    }
  ];
}


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
      trigger: CommandCalled(NextHair),
    },

    {
      scope: HairStyle2,
      target: HairStyle3,
      trigger: CommandCalled(NextHair),
    },

    {
      scope: HairStyle3,
      target: HairStyle1,
      trigger: CommandCalled(NextHair),
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
    GameState
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
      trigger: CommandCalled(Noop),
      target: ReflexQuiet
    },
    {
      trigger: CommandCalled(Coin),
      target: ReflexStart
    },
    {
      trigger: CommandCalled(Ready),
      target: ReflexWait
    },
    {
      trigger: CommandCalled(Renew),
      target: ReflexStart
    },
    {
      trigger: CommandCalled(Timeout),
      target: ReflexQuiet
    },
    {
      trigger: CommandCalled(Abort),
      target: ReflexQuiet
    },
    {
      trigger: CommandCalled(Go),
      target: ReflexQuiet
    },
    {
      trigger: CommandCalled(Finish),
      target: ReflexQuiet
    },
    {
      trigger: CommandCalled(Tock),
      target: ReflexStart
    },
    {
      scope: ReflexStart,
      trigger: CommandCalled(Warn),
      target: ReflexStart,
    },
    {
      scope: ReflexWait,
      trigger: CommandCalled(Warn),
      target: ReflexWait,
    },
    {
      scope: ReflexReact,
      trigger: CommandCalled(Warn),
      target: ReflexReact,
    },
    {
      scope: ReflexEnd,
      trigger: CommandCalled(Warn),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: CommandCalled(Tick),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: CommandCalled(Tick),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: CommandCalled(Tick),
      target: ReflexEnd,
    },
    {
      scope: ReflexEnd,
      trigger: CommandCalled(Tick),
      target: ReflexEnd,
    }
  ]
}