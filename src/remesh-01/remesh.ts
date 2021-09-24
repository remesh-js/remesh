import { Observable, Subject, Subscription, Observer } from 'rxjs';

import { shareReplay } from 'rxjs/operators';

import {
  ActionCreators,
  GeneralAction,
  Reducers,
  toActionCreators,
} from './reducer';

let remeshUid = 0;

export const Remesh = {
  get atom() {
    return RemeshAtom;
  },
  get pack() {
    return RemeshPack;
  },
  get effect() {
    return RemeshEffect;
  },
  get store() {
    return RemeshStore;
  },
};

export type RemeshNode<T = unknown> = RemeshAtom<T> | RemeshPack<T>;

export type StartValue<T extends RemeshAtom<any> = RemeshAtom<unknown>> = {
  type: 'StartValue';
  Atom: T;
  value: RemeshNodeValue<T>;
};

export type RemeshAtom<
  T = unknown,
  RS extends Reducers<T, any> = Reducers<T, any>
> = {
  type: 'RemeshAtom';
  id: number;
  name?: string;
  defaultValue: T;
  currentReducers: RS;
  actions: ActionCreators<RS>;
  startWith: (value: T) => StartValue<RemeshAtom<T>>;
  reducers: <NextReducers extends Reducers<T, any>>(
    reducers: NextReducers
  ) => RemeshAtom<T, NextReducers>;
};

export type RemeshNodeValue<T extends RemeshNode> = T extends RemeshNode<
  infer U
>
  ? U
  : never;

export type RemeshAtomOptions<T = unknown> = {
  name?: RemeshAtom<T>['name'];
  defaultValue: RemeshAtom<T>['defaultValue'];
};

export const RemeshAtom = <T>(
  options: RemeshAtomOptions<T>
): RemeshAtom<T, DefaultReducers<T>> => {
  const atomId = remeshUid++;

  const actions = toActionCreators(
    atomId,
    defaultReducers as DefaultReducers<any>
  );

  const Atom: RemeshAtom<T, DefaultReducers<T>> = {
    type: 'RemeshAtom',
    id: atomId,
    name: options.name,
    defaultValue: options.defaultValue,
    currentReducers: defaultReducers as DefaultReducers<T>,
    actions: actions,
    startWith: (value) => {
      return {
        type: 'StartValue',
        Atom,
        value,
      };
    },
    reducers: (nextReducers: any) => {
      return {
        ...Atom,
        currentReducers: nextReducers,
        actions: toActionCreators(atomId, nextReducers),
      };
    },
  };

  return Atom;
};

export type RemeshUnitOptions<T = unknown> = {
  name?: RemeshAtom<T>['name'];
  defaultValue: RemeshAtom<T>['defaultValue'];
};

type DefaultReducers<T = unknown> = {
  set: (state: T, value: T) => T;
};

const defaultReducers: DefaultReducers = {
  set: (_, value) => value,
};

export type RemeshContext = {
  get: <T>(Node: RemeshNode<T>) => T;
  get$: <T>(Node: RemeshNode<T>) => Observable<T>;
  getEffect$: <T>(Effect: RemeshEffect) => Observable<RemeshEffectAction>;
  emit: (action: RemeshEffectAction) => void;
};

export type RemeshPackContext = {
  get: RemeshContext['get'];
};

export type RemeshPack<T = unknown> = {
  type: 'RemeshPack';
  id: number;
  name?: string;
  impl: ($: RemeshPackContext) => T;
};

export type RemeshPackOptions<T> = {
  name?: RemeshPack<T>['name'];
  impl: RemeshPack<T>['impl'];
};

export const RemeshPack = <T>(options: RemeshPackOptions<T>): RemeshPack<T> => {
  const Pack: RemeshPack<T> = {
    type: 'RemeshPack',
    id: remeshUid++,
    name: options.name,
    impl: options.impl,
  };

  return Pack;
};

export type RemeshEffectContext = {
  get: RemeshContext['get'];
  get$: RemeshContext['get$'];
  getEffect$: RemeshContext['getEffect$'];
};

export type RemeshEffectNoopAction = {
  kind: 'EffectNoopAction';
};

export type RemeshEffectBatchAction = {
  kind: 'EffectBatchAction';
  effectActions: RemeshEffectAction[];
};

export type RemeshEffectAction =
  | GeneralAction
  | RemeshEffectNoopAction
  | RemeshEffectBatchAction;

export type RemeshEffect = {
  type: 'RemeshEffect';
  name?: string;
  impl: ($: RemeshEffectContext) => Observable<RemeshEffectAction>;
};

export type RemeshEffectOptions = {
  name?: RemeshEffect['name'];
  impl: RemeshEffect['impl'];
};

export type RemeshEffectFn = {
  (options: RemeshEffectOptions): RemeshEffect;
  noop(): RemeshEffectNoopAction;
  batch(effectActions: RemeshEffectAction[]): RemeshEffectBatchAction;
};

export const RemeshEffect = ((options) => {
  return {
    type: 'RemeshEffect',
    name: options.name,
    impl: options.impl,
  };
}) as RemeshEffectFn;

RemeshEffect.noop = () => {
  return {
    kind: 'EffectNoopAction',
  };
};

RemeshEffect.batch = (effectActions) => {
  return {
    kind: 'EffectBatchAction',
    effectActions,
  };
};

type RemeshAtomStorage<T = unknown> = {
  type: 'RemeshAtomStorage';
  Node: RemeshAtom<T>;
  subject: Subject<T>;
  observable: Observable<T>;
  value: T;
  downstreamSet: Set<RemeshPack<any>>;
  subscriptionSet: Set<Subscription>;
};

type RemeshPackStorage<T = unknown> = {
  type: 'RemeshPackStorage';
  Node: RemeshPack<T>;
  subject: Subject<T>;
  observable: Observable<T>;
  value: T;
  upstreamSet: Set<RemeshNode<any>>;
  downstreamSet: Set<RemeshPack<any>>;
  subscriptionSet: Set<Subscription>;
};

type RemeshNodeStorage<T = unknown> =
  | RemeshAtomStorage<T>
  | RemeshPackStorage<T>;

type RemeshEffectStorage = {
  type: 'RemeshEffectStorage';
  observable?: Observable<RemeshEffectAction>;
  Effect: RemeshEffect;
  subscriptionSet: Set<Subscription>;
};

export type RemeshStoreOptions = {
  startValues?: StartValue<RemeshAtom<any>>[];
};

export type RemeshStore = ReturnType<typeof RemeshStore>;

type RemeshStoreInternalStorage = {
  atom: Map<RemeshAtom<any>, RemeshAtomStorage<any>>;
  pack: Map<RemeshPack<any>, RemeshPackStorage<any>>;
  dirtySet: Set<RemeshNodeStorage<any>>;
  effect: Map<RemeshEffect, RemeshEffectStorage>;
  action: WeakSet<RemeshEffectAction>;
};

type DefaultEffectInputValue = {
  kind: 'DefaultEffectInputValue';
};

const defaultEffectInputValue: DefaultEffectInputValue = {
  kind: 'DefaultEffectInputValue',
};

export const RemeshStore = (options?: RemeshStoreOptions) => {
  const storage: RemeshStoreInternalStorage = {
    atom: new Map(),
    pack: new Map(),
    dirtySet: new Set(),
    effect: new Map(),
    action: new WeakSet(),
  };

  const getAtomStartValue = <T>(Atom: RemeshAtom<T>): T => {
    if (!options?.startValues) {
      return Atom.defaultValue;
    }

    for (const startValue of options.startValues) {
      if (startValue.Atom === Atom) {
        return startValue.value;
      }
    }

    return Atom.defaultValue;
  };

  const getAtomStorage = <T>(Atom: RemeshAtom<T>): RemeshAtomStorage<T> => {
    let atomStorage = storage.atom.get(Atom);

    if (!atomStorage) {
      const value = getAtomStartValue(Atom);

      const subject = new Subject<T>();
      const observable = subject.pipe(
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      );

      const currentAtomStorage: RemeshAtomStorage<T> = {
        type: 'RemeshAtomStorage',
        Node: Atom,
        subject,
        observable,
        value,
        downstreamSet: new Set(),
        subscriptionSet: new Set(),
      };

      atomStorage = currentAtomStorage;
      storage.atom.set(Atom, atomStorage);
    }

    return atomStorage;
  };

  const getPackStorage = <T>(Pack: RemeshPack<T>): RemeshPackStorage<T> => {
    let packStorage = storage.pack.get(Pack);

    if (!packStorage) {
      const subject = new Subject<T>();
      const observable = subject.pipe(
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      );
      const remeshPackContext: RemeshPackContext = {
        ...remeshContext,
        get: (Node) => {
          addUpstream(currentPackStorage, Node);
          return remeshContext.get(Node);
        },
      };
      const value = Pack.impl(remeshPackContext);

      const currentPackStorage: RemeshPackStorage<T> = {
        type: 'RemeshPackStorage',
        Node: Pack,
        subject,
        observable,
        value,
        upstreamSet: new Set(),
        downstreamSet: new Set(),
        subscriptionSet: new Set(),
      };

      packStorage = currentPackStorage;
      storage.pack.set(Pack, packStorage);
    }

    return packStorage;
  };

  const getNodeStorage = <T>(Node: RemeshNode<T>): RemeshNodeStorage<T> => {
    if (Node.type === 'RemeshAtom') {
      return getAtomStorage(Node);
    }

    if (Node.type === 'RemeshPack') {
      return getPackStorage(Node);
    }

    throw new Error(`Unknown Node in getNodeStorage(..): ${Node}`);
  };

  const getEffectStorage = (Effect: RemeshEffect): RemeshEffectStorage => {
    let effectStorage = storage.effect.get(Effect);

    if (!effectStorage) {
      effectStorage = {
        type: 'RemeshEffectStorage',
        Effect,
        subscriptionSet: new Set(),
      };
    }

    return effectStorage;
  };

  const addUpstream = <T>(
    packStorage: RemeshPackStorage<T>,
    upstreamNode: RemeshNode<any>
  ) => {
    packStorage.upstreamSet.add(upstreamNode);
    getNodeStorage(upstreamNode).downstreamSet.add(packStorage.Node);
  };

  const deleteUpstream = <T>(
    packStorage: RemeshPackStorage<T>,
    upstreamNode: RemeshNode<any>
  ) => {
    packStorage.upstreamSet.delete(upstreamNode);
    getNodeStorage(upstreamNode).downstreamSet.delete(packStorage.Node);
  };

  const deleteUpstreamSet = <T>(packStorage: RemeshPackStorage<T>) => {
    for (const upstream of packStorage.upstreamSet) {
      deleteUpstream(packStorage, upstream);
    }
  };

  const updateToDate = <T>(nodeStorage: RemeshNodeStorage<T>) => {
    if (nodeStorage.type === 'RemeshAtomStorage') {
      const atomStorage = nodeStorage;

      storage.dirtySet.add(atomStorage);

      for (const downstream of atomStorage.downstreamSet) {
        updateToDate(getPackStorage(downstream));
      }
    } else if (nodeStorage.type === 'RemeshPackStorage') {
      const packStorage = nodeStorage;

      const remeshPackContext: RemeshPackContext = {
        ...remeshContext,
        get: (Node) => {
          /**
           * collect the upstream node by tracing getter
           */
          addUpstream(packStorage, Node);
          return remeshContext.get(Node);
        },
      };

      /**
       * clear out-of-date upstream dependencies before evaluating new value
       */
      deleteUpstreamSet(packStorage);

      const newValue = packStorage.Node.impl(remeshPackContext);

      packStorage.value = newValue;

      storage.dirtySet.add(packStorage);
    }
  };

  const getEffectObservable = (
    Effect: RemeshEffect
  ): Observable<RemeshEffectAction> => {
    const effectStorage = getEffectStorage(Effect);

    if (effectStorage.observable) {
      return effectStorage.observable;
    }

    const effectContext: RemeshEffectContext = {
      ...remeshContext,
    };

    const observable = Effect.impl(effectContext);

    effectStorage.observable = observable;

    return observable;
  };

  let lock = false;

  const remeshContext: RemeshContext = {
    get: (Node) => {
      if (Node.type === 'RemeshAtom') {
        const atomStorage = getAtomStorage(Node);
        return atomStorage.value;
      }

      if (Node.type === 'RemeshPack') {
        const packStorage = getPackStorage(Node);
        return packStorage.value;
      }

      throw new Error(`Unknown Node in $.get(Node): ${Node}`);
    },
    get$: (Node) => {
      const nodeStorage = getNodeStorage(Node);
      return nodeStorage.observable;
    },
    emit: (action) => {
      /**
       * emit each action only once
       */
      if (storage.action.has(action)) {
        return;
      }

      storage.action.add(action);

      if (action.kind === 'EffectNoopAction') {
        return;
      }

      if (action.kind === 'EffectBatchAction') {
        for (const actionItem of action.effectActions) {
          remeshContext.emit(actionItem);
        }
        return;
      }

      for (const Atom of storage.atom.keys()) {
        if (action.ownerId != Atom.id) {
          continue;
        }
        const atomStorage = getAtomStorage(Atom);
        const reducer = Atom.currentReducers[action.type as any];

        if (typeof reducer !== 'function') {
          throw new Error(`Unknown action: ${JSON.stringify(action)}`);
        }

        const currentValue = atomStorage.value;
        const newValue = reducer(currentValue, action.payload);

        atomStorage.value = newValue;
        updateToDate(atomStorage);
        publish();

        return;
      }
    },
    getEffect$: (Effect) => {
      return getEffectObservable(Effect);
    },
  };

  const publish = () => {
    if (lock) return;

    const dirtyList = [...storage.dirtySet];

    storage.dirtySet.clear();

    for (const nodeStorage of dirtyList) {
      nodeStorage.subject.next(nodeStorage.value);
    }

    /**
     * recursive publish all dirty items
     */
    if (storage.dirtySet.size > 0) {
      publish();
    }
  };

  const unsubscribeNode = <T>(Node: RemeshNode<T>) => {
    const nodeStorage = getNodeStorage(Node);

    for (const subscription of nodeStorage.subscriptionSet) {
      subscription.unsubscribe();
    }

    nodeStorage.subscriptionSet.clear();
  };

  const subscribe = <T>(
    Node: RemeshNode<T>,
    observer: Partial<Observer<T>>
  ): Subscription => {
    const nodeStorage = getNodeStorage(Node);

    /**
     * Only trigger next value when changed
     */
    const subscription = nodeStorage.observable.subscribe(observer);

    nodeStorage.subscriptionSet.add(subscription);

    subscription.add(() => {
      nodeStorage.subscriptionSet.delete(subscription);
    });

    return subscription;
  };

  const clear = () => {
    for (const Atom of storage.atom.keys()) {
      unsubscribeNode(Atom);
    }

    for (const Pack of storage.pack.keys()) {
      unsubscribeNode(Pack);
    }

    for (const effectStorage of storage.effect.values()) {
      for (const subscription of effectStorage.subscriptionSet) {
        subscription.unsubscribe();
      }
      effectStorage.subscriptionSet.clear();
    }
  };

  const performEffect = (Effect: RemeshEffect): Subscription => {
    const effectStorage = getEffectStorage(Effect);
    const observable = getEffectObservable(Effect);

    const subscription = observable.subscribe((action) => {
      const previousLock = lock;

      try {
        lock = true;
        remeshContext.emit(action);
      } finally {
        lock = previousLock;
        publish();
      }
    });

    effectStorage.subscriptionSet.add(subscription);

    subscription.add(() => {
      effectStorage.subscriptionSet.delete(subscription);
    });

    return subscription;
  };

  return {
    ...remeshContext,
    performEffect,
    subscribe,
    clear,
  };
};
