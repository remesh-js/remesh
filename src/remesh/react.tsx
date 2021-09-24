import React, {
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
  useState,
  useMemo,
} from 'react';
import { RemeshEffect } from '.';

import { RemeshNode, RemeshStore, RemeshStoreOptions } from './remesh';

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

export const useRemeshStore = () => {
  const context = useRemeshReactContext();
  return context.remeshStore;
};

export type RemeshRootProps = {
  children: ReactNode;
  options?: RemeshStoreOptions;
};

export const RemeshRoot = (props: RemeshRootProps) => {
  const taskContextRef = useRef<RemeshReactContext | null>(null);

  if (taskContextRef.current === null) {
    taskContextRef.current = {
      remeshStore: RemeshStore(props.options),
    };
  }

  useEffect(() => {
    return () => {
      taskContextRef.current?.remeshStore.clear();
    };
  }, []);

  return (
    <RemeshReactContext.Provider value={taskContextRef.current}>
      {props.children}
    </RemeshReactContext.Provider>
  );
};

export const useRemeshValueCallback = function <T>(
  Node: RemeshNode<T>,
  valueHandler: (value: T) => unknown
) {
  const remeshStore = useRemeshStore();

  const valueHandlerRef = useRef(valueHandler);

  useEffect(() => {
    valueHandlerRef.current = valueHandler;
  });

  useEffect(() => {
    const subscription = remeshStore.subscribe(Node, {
      next: (newValue) => {
        valueHandlerRef.current(newValue);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [Node, remeshStore]);
};

export const useRemeshValue = function <T>(Node: RemeshNode<T>) {
  const remeshStore = useRemeshStore();
  const [value, setValue] = useState(() => remeshStore.get(Node));

  useRemeshValueCallback(Node, setValue);

  return value;
};

export const useRemeshEffect = function (Effect: RemeshEffect | null) {
  const remeshStore = useRemeshStore();

  useEffect(() => {
    if (!Effect) {
      return;
    }

    const subscription = remeshStore.performEffect(Effect);

    return () => {
      subscription.unsubscribe();
    };
  }, [remeshStore, Effect]);
};

export const useRemeshEmitter = function () {
  const remeshStore = useRemeshStore();

  const emitter = useMemo(() => {
    return {
      emit: remeshStore.emit,
    };
  }, [remeshStore]);

  return emitter;
};
