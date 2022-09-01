import * as React from 'react'
import { Steps, stepsAction } from './types'

export const FakeStepC = (props: { dispatch: React.Dispatch<stepsAction> }) => {
  return (
    <div>
      <div>
        <button
          onClick={() => {
            props.dispatch({ type: Steps.A })
          }}
        >
          To First Step
        </button>
        <button
          onClick={() => {
            props.dispatch({ type: Steps.B })
          }}
        >
          Previous Step
        </button>
      </div>
      <div>C</div>
    </div>
  )
}
