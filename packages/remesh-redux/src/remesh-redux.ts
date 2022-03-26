import { RemeshStateInspector, DefaultDomain } from 'remesh'

import type { Config as _Config } from '@redux-devtools/extension'

const getReduxDevtools = () => {
  if (typeof window !== 'undefined') {
    return window.__REDUX_DEVTOOLS_EXTENSION__
  }
}

export type RemeshReduxOptions = {
  name?: string
}

export const RemeshRedux = (options: RemeshReduxOptions): RemeshStateInspector | undefined => {
  const reduxDevtools = getReduxDevtools()

  if (!reduxDevtools) {
    return
  }

  const devtools = reduxDevtools.connect({
    name: options.name,
    features: {
      pause: false, // start/pause recording of dispatched actions
      lock: false, // lock/unlock dispatching actions and side effects
      persist: false, // persist states on page reloading
      export: true, // export history of actions in a file
      import: false, // import history of actions from a file
      jump: false, // jump back and forth (time travelling)
      skip: false, // skip (cancel) actions
      reorder: false, // drag and drop actions in the history list
      dispatch: false, // dispatch custom actions or action creators
      test: false, // generate tests for the selected actions
    },
  })

  return {
    type: 'RemeshStateInspector',
    onStateAction: (stateAction) => {
      const domain = stateAction.State.owner?.Domain ?? DefaultDomain

      const target = `${domain.domainName}/${stateAction.State.stateName}`

      if (stateAction.type === 'RemeshStateCreated') {
        const action = {
          type: `Create(${target})`,
          arg: stateAction.arg,
          state: stateAction.state,
        }

        devtools.send(action, {})
      } else if (stateAction.type === 'RemeshStateUpdated') {
        const action = {
          type: `Update(${target})`,
          arg: stateAction.arg,
          newState: stateAction.newState,
          oldState: stateAction.oldState,
        }

        devtools.send(action, {})
      }
    },
    onDestroy: () => {

    },
  }
}
