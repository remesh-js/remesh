export type ReducerWithoutPayload<State = unknown> = (state: State) => State;

export type ReducerWithPayload<State = unknown, Payload = unknown> = (
  state: State,
  payload: Payload
) => State;

export type ReducerWithOptionalPayload<State = unknown, Payload = unknown> = (
  state: State,
  payload?: Payload
) => State;

export type Reducer<State = unknown, Payload = unknown> =
  | ReducerWithPayload<State, Payload>
  | ReducerWithoutPayload<State>
  | ReducerWithOptionalPayload<State, Payload>;

export type Reducers<State = unknown, Payload = unknown> = Record<
  string,
  Reducer<State, Payload>
>;

export type GeneralAction<Type = unknown> = {
  kind: 'action';
  ownerId: number;
  type: Type;
  payload?: unknown;
};

export type GeneralActionCreator<Type = unknown> = (
  payload?: unknown
) => GeneralAction<Type>;

export type ActionWithoutPayload<Type> = {
  kind: 'action';
  ownerId: number;
  type: Type;
};

export type ActionWithPayload<Type, Payload = unknown> = {
  kind: 'action';
  ownerId: number;
  type: Type;
  payload: Payload;
};

export type ActionWithOptionalPayload<Type, Payload = unknown> = {
  kind: 'action';
  ownerId: number;
  type: Type;
  payload?: Payload;
};

export type Action<Type, Payload = unknown> =
  | ActionWithPayload<Type, Payload>
  | ActionWithOptionalPayload<Type, Payload>
  | ActionWithoutPayload<Type>;

export type ActionCreatorWithPayload<Type, Payload = unknown> = {
  (payload: Payload): ActionWithPayload<Type, Payload>;
  match(action: GeneralAction): action is ActionWithPayload<Type, Payload>;
};

export type ActionCreatorWithoutPayload<Type> = {
  (): ActionWithoutPayload<Type>;
  match(action: GeneralAction): action is ActionWithoutPayload<Type>;
};

export type ActionCreatorWithOptionalPayload<Type, Payload = unknown> = {
  (payload?: Payload): ActionWithOptionalPayload<Type, Payload>;
  match(action: GeneralAction): action is ActionWithPayload<Type, Payload>;
};

export type ActionCreator<Type, R extends Reducer<any, any>> = R extends
  | ReducerWithoutPayload
  | (() => unknown)
  ? ActionCreatorWithoutPayload<Type>
  : R extends ReducerWithOptionalPayload<any, infer Payload>
  ? ActionCreatorWithOptionalPayload<Type, Payload>
  : R extends ReducerWithPayload<any, infer Payload>
  ? ActionCreatorWithPayload<Type, Payload>
  : never;

export type ActionCreators<RS extends Reducers<any, any>> = {
  [key in keyof RS]: ActionCreator<key, RS[key]>;
};

export const toActionCreator = <Type, R extends Reducer>(
  ownerId: number,
  type: Type
): ActionCreator<Type, R> => {
  const actionCreator = ((...args: unknown[]): GeneralAction<Type> => {
    if (args.length === 1) {
      return {
        kind: 'action',
        ownerId,
        type,
        payload: args[0],
      };
    }
    return {
      kind: 'action',
      ownerId,
      type,
    };
  }) as ActionCreator<Type, R>;

  actionCreator.match = (action): action is GeneralAction<Type> => {
    return action.ownerId === ownerId && action.type === type;
  };

  return actionCreator;
};

export const toActionCreators = <RS extends Reducers>(
  ownerId: number,
  reducers: RS
): ActionCreators<RS> => {
  const actionCreators = {} as ActionCreators<RS>;

  for (const key in reducers) {
    const actionCreator = toActionCreator(ownerId, key);
    // @ts-ignore
    actionCreators[key] = actionCreator;
  }

  return actionCreators;
};
