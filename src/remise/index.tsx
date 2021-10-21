import React, { useContext, useRef, useMemo } from "react";

export type RemiseContext = {
  store: Map<Remise<any, any>, RemiseImpl<any, any>>;
};

export const RemiseContext = React.createContext<RemiseContext | null>(null);

export type RemiseProviderProps = {
  list?: RemiseImpl<any, any>[];
  children?: React.ReactNode;
};

export const RemiseProvider = (props: RemiseProviderProps) => {
  const parentRemiseContext = useContext(RemiseContext);

  const remiseContextRef = useRef<RemiseContext | null>(null);

  if (!remiseContextRef.current) {
    const store: RemiseContext["store"] = new Map();

    if (parentRemiseContext?.store) {
      for (const [Remise, remiseImpl] of parentRemiseContext.store) {
        store.set(Remise, remiseImpl);
      }
    }

    if (props.list) {
      for (const remiseImpl of props.list) {
        store.set(remiseImpl.Remise, remiseImpl);
      }
    }

    remiseContextRef.current = {
      store: store,
    };
  }

  return (
    <RemiseContext.Provider value={remiseContextRef.current}>
      {props.children}
    </RemiseContext.Provider>
  );
};

export type Remise<FromProps extends object, ToProps extends object> = {
  (props: FromProps): JSX.Element;
  type: "Remise";
  displayName: string;
  propsTransformer: (from: FromProps) => ToProps;
  impl: (
    ComponentImpl: ComponentImpl<ToProps>
  ) => RemiseImpl<FromProps, ToProps>;
};

export type ComponentImpl<Props> = (props: Props) => JSX.Element | null;

export type RemiseImpl<FromProps extends object, ToProps extends object> = {
  (props: ToProps): JSX.Element | null;
  type: "RemiseImpl";
  Remise: Remise<FromProps, ToProps>;
};

export const remise = function <
  FromProps extends object = {},
  ToProps extends object = FromProps
>(
  propsTransformer: Remise<FromProps, ToProps>["propsTransformer"] = (props) =>
    props as unknown as ToProps
): Remise<FromProps, ToProps> {
  const Remise = ((fromProps) => {
    const remiseContext = useContext(RemiseContext);

    if (!remiseContext) {
      throw new Error(`<RemiseProvider /> not found.`);
    }

    const remiseImpl = useMemo(() => {
      const store = remiseContext.store;
      const remiseImpl = store.get(Remise);

      return remiseImpl;
    }, [remiseContext]);

    const toProps = propsTransformer(fromProps);

    /**
     * If there is no implementation found, just render children directly as a placeholder component
     */
    if (!remiseImpl) {
      // @ts-ignore
      return <>{toProps?.children}</>;
    }

    return remiseImpl(toProps);
  }) as Remise<FromProps, ToProps>;

  Remise.type = "Remise";
  Remise.displayName = propsTransformer.name;
  Remise.propsTransformer = propsTransformer;

  Remise.impl = (impl) => {
    const ComponentImpl = ((props) => impl(props)) as RemiseImpl<
      FromProps,
      ToProps
    >;

    // @ts-ignore
    ComponentImpl.displayName = `Impl(${propsTransformer.name})`;
    ComponentImpl.type = "RemiseImpl";
    ComponentImpl.Remise = Remise;

    return ComponentImpl;
  };

  return Remise;
};
