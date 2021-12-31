/**
 * Functional Event Sourcing System(FESS)
 * It is a functional event system that can be used to implement event sourcing.
 * It may be used to replace rxjs in Remesh.
 */

let fessEventUid = 0;

const getEventUid = () => {
  fessEventUid += 1;
  return fessEventUid;
};

export type FessEvent<T> = {
  type: 'FessEvent';
  id: number;
  eventName: string;
  (payload: T): FessEventPayload<T>;
};

export type FessEventPayload<T> = {
  type: 'FessEventPayload';
  payload: T;
  FessEvent: FessEvent<T>;
};

export type FessEventOptions = {
  name: string;
};

export const FessEvent = <T = void>(options: FessEventOptions): FessEvent<T> => {
  const eventUid = getEventUid();
  const Event = ((payload: T): FessEventPayload<T> => {
    return {
      type: 'FessEventPayload',
      payload,
      FessEvent: Event,
    };
  }) as FessEvent<T>;

  Event.type = 'FessEvent';
  Event.id = eventUid;
  Event.eventName = options.name;

  return Event;
};

let fessStateUid = 0;

const getStateUid = () => {
  fessStateUid += 1;
  return fessStateUid;
};

export type FessState<T> = {
  type: 'FessState';
  stateName: string
  id: number;
  defaultState: T;
  Changed: FessEvent<T>;
  (state: T): FessStatePayload<T>;
};

export type FessStatePayload<T> = {
  type: 'FessStatePayload';
  state: T;
  FessState: FessState<T>;
};

export type FessStateOptions<T> = {
  name: string;
  default: T;
}

export const FessState = <T>(options: FessStateOptions<T>): FessState<T> => {
  const stateUid = getStateUid();
  const State = ((state: T): FessStatePayload<T> => {
    return {
      type: 'FessStatePayload',
      state,
      FessState: State,
    };
  }) as FessState<T>;

  State.type = 'FessState';
  State.id = stateUid;
  State.stateName = options.name;
  State.defaultState = options.default;
  State.Changed = FessEvent({ name: options.name });

  return State;
};

export type FessListenerContext = {
  get: <T>(state: FessState<T>) => T;
  set: <T>(state: FessState<T>, value: T) => void;
  emit: <T>(eventPayload: FessEventPayload<T>) => void;
};

export type FessListener<T> = {
  type: 'FessListener';
  handler: (ctx: FessListenerContext, payload: T) => unknown;
};

const listenerSetWeakMap = new WeakMap<
  FessEvent<any>,
  Set<FessListener<any>>
>();

const getListenerSet = <T>(event: FessEvent<T>): Set<FessListener<T>> => {
  let listenerSet = listenerSetWeakMap.get(event);
  if (!listenerSet) {
    listenerSet = new Set();
    listenerSetWeakMap.set(event, listenerSet);
  }
  return listenerSet as Set<FessListener<T>>;
};

export const listen = <T>(
  event: FessEvent<T>,
  handler: FessListener<T>['handler']
): FessListener<T> => {
  const listener: FessListener<T> = {
    type: 'FessListener',
    handler,
  };
  getListenerSet(event).add(listener);
  return listener;
};


export type FessStateStorage<T> = {
  type: 'FessStateStorage';
  FessState: FessState<T>;
  state: T;
};


export const FessStore = () => {
  const stateStorageMap = new Map<FessState<any>, FessStateStorage<any>>();

  const getStateStorage = <T>(state: FessState<T>): FessStateStorage<T> => {
    let stateStorage = stateStorageMap.get(state);
    if (!stateStorage) {
      stateStorage = {
        type: 'FessStateStorage',
        FessState: state,
        state: state.defaultState,
      };
      stateStorageMap.set(state, stateStorage);
    }
    return stateStorage as FessStateStorage<T>;
  };

  const getState = <T>(state: FessState<T>): T => {
    return getStateStorage(state).state;
  }

  const setState = <T>(state: FessState<T>, value: T) => {
    const stateStorage = getStateStorage(state);
    stateStorage.state = value;
    emitEvent(state.Changed(value));
  };

  const emitEvent = <T>(eventPayload: FessEventPayload<T>): void => {
    const listenerSet = getListenerSet(eventPayload.FessEvent);
    for (const listener of listenerSet) {
      listener.handler(fessListenerContext, eventPayload.payload);
    }
  }

  const fessListenerContext: FessListenerContext = {
    get: getState,
    set: setState,
    emit: emitEvent,
  }

  return {
    getState,
    setState,
    emitEvent,
  }
}