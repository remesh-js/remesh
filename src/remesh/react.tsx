import React, {
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
  useState,
} from 'react';

import {
  RemeshDomainDefinition,
  RemeshQueryPayload,
  RemeshEvent,
  RemeshStore,
  RemeshStoreOptions,
  RemeshDomain,
} from './remesh';

export type RemeshReactContext = {
  remeshStore: RemeshStore;
};

export const RemeshReactContext = createContext<RemeshReactContext | null>(
  null
);

export const useRemeshReactContext = () => {
  const context = useContext(RemeshReactContext);

  if (context === null) {
    throw new Error(`You may forgot to add <RemeshRoot />`);
  }

  return context;
};

export const useRemeshStore = (): RemeshStore => {
  const context = useRemeshReactContext();
  return context.remeshStore;
};

export type RemeshRootProps =
  | {
      children: ReactNode;
      options?: RemeshStoreOptions;
      store?: undefined;
    }
  | {
      children: ReactNode;
      store: RemeshStore;
    };

export const RemeshRoot = (props: RemeshRootProps) => {
  const taskContextRef = useRef<RemeshReactContext | null>(null);

  if (taskContextRef.current === null) {
    if (props.store) {
      taskContextRef.current = {
        remeshStore: props.store,
      };
    } else {
      taskContextRef.current = {
        remeshStore: RemeshStore({
          name: 'RemeshStore',
          ...props.options,
        }),
      };
    }
  }

  useEffect(() => {
    return () => {
      taskContextRef.current?.remeshStore.destroy();
    };
  }, []);

  return (
    <RemeshReactContext.Provider value={taskContextRef.current}>
      {props.children}
    </RemeshReactContext.Provider>
  );
};

export const useRemeshQuery = function <T, U>(
  queryPayload: RemeshQueryPayload<T, U>
): U {
  const store = useRemeshStore();

  const [state, setState] = useState(() => store.query(queryPayload));

  useEffect(() => {
    const subscription = store.subscribeQuery(queryPayload, setState);
    return () => {
      subscription.unsubscribe();
    };
  }, [queryPayload, store]);

  return state;
};

export const useRemeshEvent = function <T, U = T>(
  Event: RemeshEvent<T, U>,
  callback: (data: U) => unknown
) {
  const store = useRemeshStore();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const subscription = store.subscribeEvent(Event, (data) => {
      callbackRef.current(data);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [Event, store]);
};

export const useRemeshEmit = function () {
  const store = useRemeshStore();

  return store.emitEvent;
};

export const useRemeshDomain = function <T extends RemeshDomainDefinition>(
  Domain: RemeshDomain<T>
) {
  const store = useRemeshStore();
  const domain = store.getDomain(Domain);

  useEffect(() => {
    const subscription = store.subscribeDomain(Domain);
    return () => {
      subscription.unsubscribe();
    };
  }, [store, Domain]);

  return domain;
};
