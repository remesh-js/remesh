import { Observable, Subject, Subscription } from 'rxjs';

import {
  RemeshCommand,
  RemeshCommand$,
  RemeshCommand$Context,
  RemeshCommand$Payload,
  RemeshCommandContext,
  RemeshCommandOutput,
  RemeshCommandPayload,
  RemeshDefaultState,
  RemeshDefaultStateOptions,
  RemeshDomain,
  RemeshDomainContext,
  RemeshDomainDefinition,
  RemeshEvent,
  RemeshEventPayload,
  RemeshExtern,
  RemeshExternPayload,
  RemeshInjectedContext,
  RemeshQuery,
  RemeshQueryContext,
  RemeshQueryPayload,
  RemeshState,
  RemeshStateItem,
  RemeshStateOptions,
  RemeshStatePayload,
} from './remesh';

export type RemeshStore = ReturnType<typeof RemeshStore>;

type RemeshStateStorage<T, U> = {
  type: 'RemeshStateStorage';
  State: RemeshState<T, U>;
  arg: U;
  key: string;
  currentState: U;
  downstreamSet: Set<RemeshQueryStorage<any, any>>;
};

type RemeshQueryStorage<T, U> = {
  type: 'RemeshQueryStorage';
  Query: RemeshQuery<T, U>;
  arg: T;
  key: string;
  currentValue: U;
  upstreamSet: Set<RemeshQueryStorage<any, any> | RemeshStateStorage<any, any>>;
  downstreamSet: Set<RemeshQueryStorage<any, any>>;
  subject: Subject<U>;
  observable: Observable<U>;
  refCount: number;
};

type RemeshEventStorage<T = unknown, U = T> = {
  type: 'RemeshEventStorage';
  Event: RemeshEvent<T, U>;
  subject: Subject<U>;
  observable: Observable<U>;
  refCount: number;
};

type RemeshCommand$Storage<T> = {
  type: 'RemeshCommand$Storage';
  Command$: RemeshCommand$<T>;
  subject: Subject<T>;
  observable: Observable<T>;
  subscription?: Subscription;
};

type RemeshDomainStorage<T extends RemeshDomainDefinition> = {
  type: 'RemeshDomainStorage';
  Domain: RemeshDomain<T>;
  domain: T;
  upstreamSet: Set<RemeshDomainStorage<any>>;
  downstreamSet: Set<RemeshDomainStorage<any>>;
  domainSubscriptionSet: Set<Subscription>;
  upstreamSubscriptionSet: Set<Subscription>;
  command$Set: Set<RemeshCommand$<any>>;
  stateMap: Map<string, RemeshStateStorage<any, any>>;
  queryMap: Map<string, RemeshQueryStorage<any, any>>;
  eventMap: Map<RemeshEvent<any, any>, RemeshEventStorage<any>>;
  command$Map: Map<RemeshCommand$<any>, RemeshCommand$Storage<any>>;
  refCount: number;
  running: boolean;
};

type RemeshExternStorage<T> = {
  type: 'RemeshExternStorage';
  Extern: RemeshExtern<T>;
  currentValue: T;
};

export type RemeshStoreOptions = {
  name: string;
  externs?: RemeshExternPayload<any>[];
};

const DefaultDomain = RemeshDomain({
  name: 'DefaultDomain',
  impl: () => {
    return {};
  },
});

export const RemeshStore = (options: RemeshStoreOptions) => {
  const dirtySet = new Set<RemeshQueryStorage<any, any>>();
  const domainStorageMap = new Map<
    RemeshDomain<any>,
    RemeshDomainStorage<any>
  >();
  const externStorageMap = new Map<
    RemeshExtern<any>,
    RemeshExternStorage<any>
  >();

  type PendingClearItem =
    | RemeshStateStorage<any, any>
    | RemeshDomainStorage<any>
    | RemeshEventStorage<any, any>
    | RemeshQueryStorage<any, any>;

  const pendingStorageSet = new Set<PendingClearItem>();

  const getExternValue = <T>(Extern: RemeshExtern<T>): T => {
    for (const payload of options.externs ?? []) {
      if (payload.Extern === Extern) {
        return payload.value;
      }
    }
    return Extern.default;
  };

  const getExternStorage = <T>(
    Extern: RemeshExtern<T>
  ): RemeshExternStorage<T> => {
    const externStorage = externStorageMap.get(Extern);

    if (externStorage) {
      return externStorage;
    }

    const currentValue = getExternValue(Extern);

    const currentExternStorage: RemeshExternStorage<T> = {
      type: 'RemeshExternStorage',
      Extern,
      currentValue,
    };

    externStorageMap.set(Extern, currentExternStorage);

    return getExternStorage(Extern);
  };

  const getExternCurrentValue = <T>(Extern: RemeshExtern<T>): T => {
    return getExternStorage(Extern).currentValue;
  };

  const storageKeyWeakMap = new WeakMap<
    RemeshQueryPayload<any, any> | RemeshStateItem<any, any>,
    string
  >();

  const getStateStorageKey = <T, U>(
    stateItem: RemeshStateItem<T, U>
  ): string => {
    const key = storageKeyWeakMap.get(stateItem);

    if (key) {
      return key;
    }

    const stateName = stateItem.State.stateName;
    const argString = JSON.stringify(stateItem.arg) ?? '';
    const keyString = `State/${stateItem.State.stateId}/${stateName}/${argString}`;

    storageKeyWeakMap.set(stateItem, keyString);

    return keyString;
  };

  const getQueryStorageKey = <T, U>(
    queryPayload: RemeshQueryPayload<T, U>
  ): string => {
    const key = storageKeyWeakMap.get(queryPayload);

    if (key) {
      return key;
    }

    const queryName = queryPayload.Query.queryName;
    const argString = JSON.stringify(queryPayload.arg) ?? '';
    const keyString = `Query/${queryPayload.Query.queryId}/${queryName}/${argString}`;

    storageKeyWeakMap.set(queryPayload, keyString);

    return keyString;
  };

  const getStorageKey = <T, U>(
    stateItem: RemeshStateItem<T, U> | RemeshQueryPayload<T, U>
  ): string => {
    if (stateItem.type === 'RemeshStateItem') {
      return getStateStorageKey(stateItem);
    } else {
      return getQueryStorageKey(stateItem);
    }
  };

  const getStateStorage = <T, U>(
    stateItem: RemeshStateItem<T, U>
  ): RemeshStateStorage<T, U> => {
    const domainStorage = getDomainStorage(
      stateItem.State.ownerDomain ?? DefaultDomain
    );
    const key = getStateStorageKey(stateItem);
    const stateStorage = domainStorage.stateMap.get(key);

    if (stateStorage) {
      return stateStorage as RemeshStateStorage<T, U>;
    }

    domainStorage.stateMap.set(key, {
      type: 'RemeshStateStorage',
      State: stateItem.State,
      arg: stateItem.arg,
      key: key,
      currentState: stateItem.State.impl(stateItem.arg),
      downstreamSet: new Set(),
    });

    return getStateStorage(stateItem);
  };

  const getEventStorage = <T, U = T>(
    Event: RemeshEvent<T, U>
  ): RemeshEventStorage<T, U> => {
    const domainStorage = getDomainStorage(Event.ownerDomain ?? DefaultDomain);
    const eventStorage = domainStorage.eventMap.get(Event);

    if (eventStorage) {
      return eventStorage as RemeshEventStorage<T, U>;
    }

    const subject = new Subject<U>();

    const observable = new Observable<U>((subscriber) => {
      const subscription = subject.subscribe(subscriber);
      currentEventStorage.refCount += 1;
      return () => {
        subscription.unsubscribe();
        currentEventStorage.refCount -= 1;
        pendingStorageSet.add(currentEventStorage);
        commit();
      };
    });

    const currentEventStorage: RemeshEventStorage<T, U> = {
      type: 'RemeshEventStorage',
      Event,
      subject,
      observable,
      refCount: 0,
    };

    domainStorage.eventMap.set(Event, currentEventStorage);

    return getEventStorage(Event);
  };

  const getQueryStorage = <T, U>(
    queryPayload: RemeshQueryPayload<T, U>
  ): RemeshQueryStorage<T, U> => {
    const domainStorage = getDomainStorage(
      queryPayload.Query.ownerDomain ?? DefaultDomain
    );
    const key = getQueryStorageKey(queryPayload);
    const queryStorage = domainStorage.queryMap.get(key);

    if (queryStorage) {
      return queryStorage;
    }

    const subject = new Subject<U>();

    const observable = new Observable<U>((subscriber) => {
      const subscription = subject.subscribe(subscriber);

      currentQueryStorage.refCount += 1;

      return () => {
        subscription.unsubscribe();
        currentQueryStorage.refCount -= 1;
        pendingStorageSet.add(currentQueryStorage);
        commit();
      };
    });

    const upstreamSet: RemeshQueryStorage<T, U>['upstreamSet'] = new Set();
    const downstreamSet: RemeshQueryStorage<T, U>['downstreamSet'] = new Set();

    const { Query } = queryPayload;

    const queryContext: RemeshQueryContext = {
      get: (input) => {
        if (input.type === 'RemeshStateItem') {
          const upstreamStateStorage = getStateStorage(input);
          upstreamSet.add(upstreamStateStorage);
          return remeshInjectedContext.get(input);
        }

        if (input.type === 'RemeshQueryPayload') {
          const upstreamQueryStorage = getQueryStorage(input);
          upstreamSet.add(upstreamQueryStorage);
          return remeshInjectedContext.get(input);
        }

        return remeshInjectedContext.get(input);
      },
    };

    const currentValue = Query.impl(queryContext, queryPayload.arg);

    const currentQueryStorage: RemeshQueryStorage<T, U> = {
      type: 'RemeshQueryStorage',
      Query: queryPayload.Query,
      arg: queryPayload.arg,
      currentValue,
      key: key,
      upstreamSet,
      downstreamSet,
      subject,
      observable,
      refCount: 0,
    };

    for (const upstream of upstreamSet) {
      upstream.downstreamSet.add(currentQueryStorage);
    }

    domainStorage.queryMap.set(key, currentQueryStorage);

    return currentQueryStorage;
  };

  const getCommand$Storage = <T>(
    Command$: RemeshCommand$<T>
  ): RemeshCommand$Storage<T> => {
    const domainStorage = getDomainStorage(Command$.Domain ?? DefaultDomain);
    const command$Storage = domainStorage.command$Map.get(Command$);

    if (command$Storage) {
      return command$Storage;
    }

    const subject = new Subject<T>();
    const observable = subject.asObservable();

    const currentCommand$Storage: RemeshCommand$Storage<T> = {
      type: 'RemeshCommand$Storage',
      Command$,
      subject,
      observable,
    };

    domainStorage.command$Map.set(Command$, currentCommand$Storage);

    return currentCommand$Storage;
  };

  const getDomainStorage = <T extends RemeshDomainDefinition>(
    Domain: RemeshDomain<T>
  ): RemeshDomainStorage<T> => {
    const domainStorage = domainStorageMap.get(Domain);

    if (domainStorage) {
      return domainStorage;
    }

    let isDomainInited = false;

    const upstreamSet: RemeshDomainStorage<T>['upstreamSet'] = new Set();
    const command$Set: RemeshDomainStorage<T>['command$Set'] = new Set();

    const domainContext: RemeshDomainContext = {
      state: (
        options:
          | RemeshStateOptions<unknown, unknown>
          | RemeshDefaultStateOptions<unknown>
      ): any => {
        if (isDomainInited) {
          throw new Error(`Unexpected calling domain.state(..) asynchronously`);
        }

        if ('default' in options) {
          const StaticState = RemeshDefaultState(options);
          StaticState.ownerDomain = Domain;
          return StaticState;
        }

        const State = RemeshState(options);
        State.ownerDomain = Domain;
        return State;
      },
      query: (options) => {
        if (isDomainInited) {
          throw new Error(`Unexpected calling domain.query(..) asynchronously`);
        }
        const Query = RemeshQuery(options);
        Query.ownerDomain = Domain;
        return Query;
      },
      event: (options) => {
        if (isDomainInited) {
          throw new Error(`Unexpected calling domain.event(..) asynchronously`);
        }
        const Event = RemeshEvent(options);
        Event.ownerDomain = Domain;
        return Event;
      },
      command: (options) => {
        if (isDomainInited) {
          throw new Error(
            `Unexpected calling domain.command(..) asynchronously`
          );
        }
        const Command = RemeshCommand(options);
        Command.Domain = Domain;
        return Command;
      },
      command$: (options) => {
        if (isDomainInited) {
          throw new Error(
            `Unexpected calling domain.command$(..) asynchronously`
          );
        }
        const Command$ = RemeshCommand$(options);
        Command$.Domain = Domain;
        command$Set.add(Command$);
        return Command$;
      },
      module: (remeshModule) => {
        if (isDomainInited) {
          throw new Error(
            `Unexpected calling domain.module(..) asynchronously`
          );
        }

        const moduleResult = remeshModule(domainContext);

        return moduleResult;
      },
      getDomain: (UpstreamDomain) => {
        const upstreamDomainStorage = getDomainStorage(UpstreamDomain);

        upstreamSet.add(upstreamDomainStorage);

        return upstreamDomainStorage.domain;
      },
      getExtern: (Extern) => {
        return getExternCurrentValue(Extern);
      },
    };

    const domain = Domain.impl(domainContext);

    isDomainInited = true;
    const currentDomainStorage: RemeshDomainStorage<T> = {
      type: 'RemeshDomainStorage',
      Domain,
      domain,
      command$Set,
      upstreamSet,
      downstreamSet: new Set(),
      upstreamSubscriptionSet: new Set(),
      domainSubscriptionSet: new Set(),
      stateMap: new Map(),
      queryMap: new Map(),
      eventMap: new Map(),
      command$Map: new Map(),
      refCount: 0,
      running: false,
    };

    domainStorageMap.set(Domain, currentDomainStorage);

    for (const upstreamDomainStorage of upstreamSet) {
      upstreamDomainStorage.downstreamSet.add(currentDomainStorage);
    }

    return getDomainStorage(Domain);
  };

  const clearQueryStorage = <T, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const domainStorage = getDomainStorage(
      queryStorage.Query.ownerDomain ?? DefaultDomain
    );

    queryStorage.subject.complete();
    domainStorage.queryMap.delete(queryStorage.key);

    for (const upstreamStorage of queryStorage.upstreamSet) {
      upstreamStorage.downstreamSet.delete(queryStorage);

      if (upstreamStorage.type === 'RemeshQueryStorage') {
        clearQueryStorageIfNeeded(upstreamStorage);
      } else if (upstreamStorage.type === 'RemeshStateStorage') {
        clearStateStorageIfNeeded(upstreamStorage);
      } else {
        throw new Error(
          `Unknown upstream in clearQueryStorageIfNeeded(..): ${upstreamStorage}`
        );
      }
    }
  };

  const clearQueryStorageIfNeeded = <T, U>(
    queryStorage: RemeshQueryStorage<T, U>
  ) => {
    if (queryStorage.refCount !== 0) {
      return;
    }

    if (queryStorage.downstreamSet.size !== 0) {
      return;
    }

    clearQueryStorage(queryStorage);
  };

  const clearStateStorage = <T, U>(stateStorage: RemeshStateStorage<T, U>) => {
    const domainStorage = getDomainStorage(
      stateStorage.State.ownerDomain ?? DefaultDomain
    );
    if (domainStorage.stateMap.has(stateStorage.key)) {
      console.log('delete', stateStorage.key);
    }

    domainStorage.stateMap.delete(stateStorage.key);
  };

  const clearStateStorageIfNeeded = <T, U>(
    stateStorage: RemeshStateStorage<T, U>
  ) => {
    if (stateStorage.downstreamSet.size !== 0) {
      return;
    }

    clearStateStorage(stateStorage);
  };

  const clearEventStorage = <T, U>(eventStorage: RemeshEventStorage<T, U>) => {
    const domainStorage = getDomainStorage(
      eventStorage.Event.ownerDomain ?? DefaultDomain
    );

    eventStorage.subject.complete();
    domainStorage.eventMap.delete(eventStorage.Event);
  };

  const clearEventStorageIfNeeded = <T, U>(
    eventStorage: RemeshEventStorage<T, U>
  ) => {
    if (eventStorage.refCount !== 0) {
      return;
    }

    clearEventStorage(eventStorage);
  };

  const clearCommand$Storage = <T>(
    command$Storage: RemeshCommand$Storage<T>
  ) => {
    const domainStorage = getDomainStorage(
      command$Storage.Command$.Domain ?? DefaultDomain
    );

    command$Storage.subject.complete();
    command$Storage.subscription?.unsubscribe();
    domainStorage.command$Map.delete(command$Storage.Command$);
  };

  const clearDomainStorage = <T extends RemeshDomainDefinition>(
    domainStorage: RemeshDomainStorage<T>
  ) => {
    const upstreamList = [...domainStorage.upstreamSet];

    clearSubscriptionSet(domainStorage.domainSubscriptionSet);
    clearSubscriptionSet(domainStorage.upstreamSubscriptionSet);

    for (const eventStorage of domainStorage.eventMap.values()) {
      clearEventStorage(eventStorage);
    }

    for (const queryStorage of domainStorage.queryMap.values()) {
      clearQueryStorage(queryStorage);
    }

    for (const stateStorage of domainStorage.stateMap.values()) {
      clearStateStorage(stateStorage);
    }

    for (const command$Storage of domainStorage.command$Map.values()) {
      clearCommand$Storage(command$Storage);
    }

    domainStorage.upstreamSubscriptionSet.clear();
    domainStorage.domainSubscriptionSet.clear();
    domainStorage.downstreamSet.clear();
    domainStorage.upstreamSet.clear();
    domainStorage.stateMap.clear();
    domainStorage.queryMap.clear();
    domainStorage.eventMap.clear();

    domainStorageMap.delete(domainStorage.Domain);

    for (const upstreamDomainStorage of upstreamList) {
      upstreamDomainStorage.downstreamSet.delete(domainStorage);
      clearDomainStorageIfNeeded(upstreamDomainStorage);
    }
  };

  const clearDomainStorageIfNeeded = <T extends RemeshDomainDefinition>(
    domainStorage: RemeshDomainStorage<T>
  ) => {
    if (domainStorage.refCount !== 0) {
      return;
    }

    if (domainStorage.downstreamSet.size !== 0) {
      return;
    }

    if (domainStorage.domainSubscriptionSet.size !== 0) {
      return;
    }

    clearDomainStorage(domainStorage);
  };

  const getCurrentState = <T, U>(stateItem: RemeshStateItem<T, U>): U => {
    const stateStorage = getStateStorage(stateItem);

    return stateStorage.currentState;
  };

  const getCurrentQueryValue = <T, U>(
    queryPayload: RemeshQueryPayload<T, U>
  ): U => {
    const queryStorage = getQueryStorage(queryPayload);

    return queryStorage.currentValue;
  };

  const remeshInjectedContext: RemeshInjectedContext = {
    get: (input) => {
      if (input.type === 'RemeshStateItem') {
        return getCurrentState(input);
      }

      if (input.type === 'RemeshQueryPayload') {
        return getCurrentQueryValue(input);
      }

      throw new Error(`Unexpected input in ctx.get(..): ${input}`);
    },
    fromEvent: (Event) => {
      const eventStorage = getEventStorage(Event);
      return eventStorage.observable;
    },
    fromQuery: (queryPayload) => {
      const queryStorage = getQueryStorage(queryPayload);
      return queryStorage.observable;
    },
  };

  const updateQueryStorage = <T, U>(queryStorage: RemeshQueryStorage<T, U>) => {
    const { Query } = queryStorage;

    for (const upstream of queryStorage.upstreamSet) {
      upstream.downstreamSet.delete(queryStorage);
      if (upstream.downstreamSet.size === 0) {
        pendingStorageSet.add(upstream);
      }
    }

    queryStorage.upstreamSet.clear();

    const queryContext: RemeshQueryContext = {
      get: (input) => {
        if (input.type === 'RemeshStateItem') {
          const stateItem = input;
          const upstreamStateStorage = getStateStorage(stateItem);
          queryStorage.upstreamSet.add(upstreamStateStorage);
          upstreamStateStorage.downstreamSet.add(queryStorage);
          return remeshInjectedContext.get(stateItem);
        }

        if (input.type === 'RemeshQueryPayload') {
          const queryPayload = input;
          const upstreamQueryStorage = getQueryStorage(queryPayload);
          queryStorage.upstreamSet.add(upstreamQueryStorage);
          upstreamQueryStorage.downstreamSet.add(queryStorage);
          return remeshInjectedContext.get(queryPayload);
        }

        return remeshInjectedContext.get(input);
      },
    };

    const newValue = Query.impl(queryContext, queryStorage.arg);

    const isEqual = Query.compare(queryStorage.currentValue, newValue);

    if (isEqual) {
      return;
    }

    queryStorage.currentValue = newValue;

    dirtySet.add(queryStorage);

    /**
     * updateQueryStorage may update upstream.downstreamSet
     * so it should be converted to an array for avoiding infinite loop
     */
    for (const downstream of [...queryStorage.downstreamSet]) {
      updateQueryStorage(downstream);
    }
  };

  const clearPendingStorageSetIfNeeded = () => {
    if (pendingStorageSet.size === 0) {
      return;
    }

    const storageList = [...pendingStorageSet];

    pendingStorageSet.clear();

    for (const storage of storageList) {
      if (storage.type === 'RemeshDomainStorage') {
        clearDomainStorageIfNeeded(storage);
      } else if (storage.type === 'RemeshEventStorage') {
        clearEventStorageIfNeeded(storage);
      } else if (storage.type === 'RemeshQueryStorage') {
        clearQueryStorageIfNeeded(storage);
      } else if (storage.type === 'RemeshStateStorage') {
        clearStateStorageIfNeeded(storage);
      }
    }

    clearPendingStorageSetIfNeeded();
  };

  const clearIfNeeded = () => {
    clearDirtySetIfNeeded();
    clearPendingStorageSetIfNeeded();
  };

  const clearDirtySetIfNeeded = () => {
    if (dirtySet.size === 0) {
      return;
    }

    const queryStorageList = [...dirtySet];

    dirtySet.clear();

    for (const queryStorage of queryStorageList) {
      if (!dirtySet.has(queryStorage)) {
        queryStorage.subject.next(queryStorage.currentValue);
      }
    }

    /**
     * recursively consuming dirty set unit it become empty.
     */
    clearDirtySetIfNeeded();
  };

  const commit = () => {
    clearIfNeeded();
  };

  const handleStatePayload = (
    statePayload: RemeshStatePayload<unknown, unknown>
  ) => {
    const stateStorage = getStateStorage(statePayload.stateItem);
    const isEqual = statePayload.stateItem.State.compare(
      stateStorage.currentState,
      statePayload.newState
    );

    if (isEqual) {
      return;
    }

    stateStorage.arg = statePayload.stateItem.arg;
    stateStorage.key = getStateStorageKey(statePayload.stateItem);
    stateStorage.currentState = statePayload.newState;

    /**
     * updateQueryStorage may update upstream.downstreamSet
     * so it should be converted to an array for avoiding infinite loop
     */
    for (const downstream of [...stateStorage.downstreamSet]) {
      updateQueryStorage(downstream);
    }

    commit();
  };

  const handleEventPayload = <T, U = T>(
    eventPayload: RemeshEventPayload<T, U>
  ) => {
    const { Event, arg } = eventPayload;
    const eventStorage = getEventStorage(Event);

    if (Event.impl) {
      const eventContext = {
        get: remeshInjectedContext.get,
      };
      const data = Event.impl(eventContext, arg);
      eventStorage.subject.next(data);
    } else {
      eventStorage.subject.next(arg as unknown as U);
    }
  };

  const handleCommandPayload = <T>(commandPayload: RemeshCommandPayload<T>) => {
    const { Command, arg } = commandPayload;
    const commandContext: RemeshCommandContext = {
      get: remeshInjectedContext.get,
    };
    const commandOutput = Command.impl(commandContext, arg);

    handleCommandOutput(commandOutput);
  };

  const handleSubscription = (
    subscriptionSet: Set<Subscription>,
    subscription: Subscription
  ) => {
    subscriptionSet.add(subscription);

    subscription.add(() => {
      subscriptionSet.delete(subscription);
    });
  };

  const initCommand$IfNeeded = <T>(Command$: RemeshCommand$<T>) => {
    const command$Storage = getCommand$Storage(Command$);

    if (command$Storage.subscription) {
      return;
    }

    const command$Context: RemeshCommand$Context = {
      get: remeshInjectedContext.get,
      fromEvent: remeshInjectedContext.fromEvent,
      fromQuery: remeshInjectedContext.fromQuery,
    };

    const subscription = Command$.impl(
      command$Context,
      command$Storage.observable
    ).subscribe(handleCommandOutput);
    command$Storage.subscription = subscription;
  };

  const handleCommandOutput = (commandOutput: RemeshCommandOutput) => {
    if (Array.isArray(commandOutput)) {
      for (const item of commandOutput) {
        handleCommandOutput(item);
      }
      return;
    }

    if (commandOutput.type === 'RemeshCommandPayload') {
      handleCommandPayload(commandOutput);
      return;
    } else if (commandOutput.type === 'RemeshEventPayload') {
      handleEventPayload(commandOutput);
      return;
    } else if (commandOutput.type === 'RemeshStateSetterPayload') {
      handleStatePayload(commandOutput);
      return;
    } else if (commandOutput.type === 'RemeshCommand$Payload') {
      handleCommand$Payload(commandOutput);
      return;
    }

    throw new Error(`Unknown command output of ${commandOutput}`);
  };

  const handleCommand$Payload = <T>(
    command$Payload: RemeshCommand$Payload<T>
  ) => {
    const { Command$, arg } = command$Payload;
    const command$Storage = getCommand$Storage(Command$);

    initCommand$IfNeeded(Command$);
    command$Storage.subject.next(arg);
  };

  const addDomainSubscription = (
    domainStorage: RemeshDomainStorage<any>,
    domainSubscription: Subscription
  ) => {
    handleSubscription(domainStorage.domainSubscriptionSet, domainSubscription);

    domainSubscription.add(() => {
      pendingStorageSet.add(domainStorage);
      commit();
    });
  };

  const subscribeQuery = <T, U>(
    queryPayload: RemeshQueryPayload<T, U>,
    subscriber: (data: U) => unknown
  ): Subscription => {
    const queryStorage = getQueryStorage(queryPayload);
    const subscription = queryStorage.observable.subscribe(subscriber);

    return subscription;
  };

  const subscribeEvent = <T, U = T>(
    Event: RemeshEvent<T, U>,
    subscriber: (event: U) => unknown
  ) => {
    const eventStorage = getEventStorage(Event);
    const subscription = eventStorage.observable.subscribe(subscriber);

    return subscription;
  };

  type BindingCommand<T extends RemeshDomainDefinition['command']> =
    T extends {}
      ? {
          [key in keyof T]: (...args: Parameters<T[key]>) => void;
        }
      : never;

  type BindingDomainOutput<T extends RemeshDomainDefinition> = T & {
    command: BindingCommand<T['command']> | undefined;
  };

  const getCommand = <T extends RemeshDomainDefinition>(
    Domain: RemeshDomain<T>
  ) => {
    const domainStorage = getDomainStorage(Domain);
    const domain = domainStorage.domain;

    if (domain.command) {
      const command = {} as BindingCommand<T['command']>;

      for (const key in domain.command) {
        const Command = domain.command[key];
        // @ts-ignore
        command[key] = (arg) => emitCommand(Command(arg));
      }

      return command;
    }
  };

  const domainOutputWeakMap = new WeakMap<
    RemeshDomain<any>,
    BindingDomainOutput<any>
  >();

  const getDomain = <T extends RemeshDomainDefinition>(
    Domain: RemeshDomain<T>
  ): BindingDomainOutput<T> => {
    if (domainOutputWeakMap.has(Domain)) {
      return domainOutputWeakMap.get(Domain);
    }

    const domainStorage = getDomainStorage(Domain);
    const domain = domainStorage.domain;
    const command = getCommand(Domain);

    const domainOutput = {
      ...domain,
      command,
    };

    domainOutputWeakMap.set(Domain, domainOutput);

    return domainOutput;
  };

  const initCommand$Set = (
    command$Set: RemeshDomainStorage<any>['command$Set']
  ) => {
    for (const Command$ of command$Set) {
      initCommand$IfNeeded(Command$);
    }

    command$Set.clear();
  };

  const runDomainStorageIfNeeded = <T extends RemeshDomainDefinition>(
    domainStorage: RemeshDomainStorage<T>
  ) => {
    if (domainStorage.running) {
      return;
    }

    domainStorage.running = true;

    for (const upstreamDomainStorage of domainStorage.upstreamSet) {
      const upstreamDomainSubscription = subscribeDomain(
        upstreamDomainStorage.Domain
      );
      handleSubscription(
        domainStorage.upstreamSubscriptionSet,
        upstreamDomainSubscription
      );
    }

    initCommand$Set(domainStorage.command$Set);
  };

  const subscribeDomain = <T extends RemeshDomainDefinition>(
    Domain: RemeshDomain<T>
  ): Subscription => {
    const domainStorage = getDomainStorage(Domain);
    const domainSubscription = new Subscription();

    addDomainSubscription(domainStorage, domainSubscription);
    runDomainStorageIfNeeded(domainStorage);

    return domainSubscription;
  };

  const destroy = () => {
    for (const domainStorage of domainStorageMap.values()) {
      clearDomainStorage(domainStorage);
    }
    domainStorageMap.clear();
    dirtySet.clear();
  };

  const emitEvent = <T, U>(eventPayload: RemeshEventPayload<T, U>) => {
    handleEventPayload(eventPayload);
  };

  const emitCommand = <T>(
    input: RemeshCommandPayload<T> | RemeshCommand$Payload<T>
  ) => {
    if (input.type === 'RemeshCommandPayload') {
      handleCommandPayload(input);
    } else if (input.type === 'RemeshCommand$Payload') {
      handleCommand$Payload(input);
    }
  };

  return {
    name: options.name,
    getDomain,
    query: getCurrentQueryValue,
    emitEvent,
    emitCommand,
    destroy,
    subscribeQuery,
    subscribeEvent,
    subscribeDomain,
    getKey: getStorageKey,
  };
};

const clearSubscriptionSet = (subscriptionSet: Set<Subscription>) => {
  for (const subscription of subscriptionSet) {
    subscription.unsubscribe();
  }
};
