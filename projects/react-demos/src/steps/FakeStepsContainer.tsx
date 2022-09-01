import * as React from 'react'
import { FakeStepA } from './FakeStepA'
import { FakeStepB } from './FakeStepB'
import { FakeStepC } from './FakeStepC'
import { Steps, StepsReducer } from './types'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { FakeDomain } from './FakeDomain'

const initState = {
  currentStep: Steps.A,
}

const stepComponentMap = {
  [Steps.A]: FakeStepA,
  [Steps.B]: FakeStepB,
  [Steps.C]: FakeStepC,
}

export const FakeStepsContainer = () => {
  const [state, dispatch] = React.useReducer<StepsReducer>((state, action) => {
    switch (action.type) {
      case Steps.A:
        return { currentStep: Steps.A }
      case Steps.B:
        return { currentStep: Steps.B }
      case Steps.C:
        return { currentStep: Steps.C }
    }
  }, initState)

  const CurrentStep = stepComponentMap[state.currentStep]

  return (
    <div>
      <CurrentStep dispatch={dispatch} />
    </div>
  )
}
