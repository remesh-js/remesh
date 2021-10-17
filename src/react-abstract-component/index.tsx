import React, { useContext, useRef, useMemo } from "react"

export type RacContext = {
  implMap: Map<Rac<any>, RacImpl<any>>
}

export const RacContext = React.createContext<RacContext | null>(null)

export type RacProviderProps = {
  implList?: RacImpl<any>[]
  children?: React.ReactNode
}

export const RacProvider = (props: RacProviderProps) => {
  const parentRacContext = useContext(RacContext)

  const racContextRef = useRef<RacContext | null>(null)

  if (!racContextRef.current) {
    const implMap: RacContext["implMap"] = new Map()

    if (parentRacContext?.implMap) {
      for (const [Rac, racImpl] of parentRacContext.implMap) {
        implMap.set(Rac, racImpl)
      }
    }

    if (props.implList) {
      for (const racImpl of props.implList) {
        implMap.set(racImpl.Rac, racImpl)
      }
    }

    racContextRef.current = {
      implMap,
    }
  }

  return (
    <RacContext.Provider value={racContextRef.current}>
      {props.children}
    </RacContext.Provider>
  )
}

export type Rac<Props extends object> = {
  (props: Props): JSX.Element
  type: "Rac"
  racId: number
  racName: string
  impl: (impl: ComponentImpl<Props>) => RacImpl<Props>
}

export type ComponentImpl<Props> = (props: Props) => JSX.Element

export type RacImpl<Props extends object> = {
  type: "RacImpl"
  Rac: Rac<Props>
  ComponentImpl: ComponentImpl<Props>
}

export type ReactAbstractComponentOptions<Props extends object> = {
  name: Rac<Props>["racName"]
}

let racUid = 0
export const createAbstractComponent = function <Props extends object>(
  options: ReactAbstractComponentOptions<Props>
): Rac<Props> {
  const Rac = ((props) => {
    const racContext = useContext(RacContext)

    if (!racContext) {
      throw new Error(`<RacProvider /> not found.`)
    }

    const Impl = useMemo((): ComponentImpl<Props> => {
      const implMap = racContext.implMap
      const ComponentImpl = implMap.get(Rac)

      if (!ComponentImpl) {
        throw new Error(`${options.name} was not implemented or injected`)
      }

      return ComponentImpl.ComponentImpl
    }, [racContext])

    return <Impl {...props} />
  }) as Rac<Props>

  Rac.type = "Rac"
  Rac.racId = racUid++
  Rac.racName = options.name

  Rac.impl = (ComponentImpl) => {
    // @ts-ignore
    ComponentImpl.displayName =
      // @ts-ignore
      ComponentImpl.displayName ?? `Impl(${options.name})`
    return {
      type: "RacImpl",
      Rac,
      ComponentImpl,
    }
  }

  return Rac
}
