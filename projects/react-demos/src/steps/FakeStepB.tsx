import * as React from 'react'
import { Steps, stepsAction } from './types'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { FakeDomain } from './FakeDomain'

export const FakeStepB = (props: { dispatch: React.Dispatch<stepsAction> }) => {
  const domain = useRemeshDomain(FakeDomain())

  const b = useRemeshQuery(domain.query.BQuery())

  return (
    <div>
      <div>
        <button
          onClick={() => {
            props.dispatch({ type: Steps.C })
          }}
        >
          Next Step
        </button>
        <button
          onClick={() => {
            props.dispatch({ type: Steps.A })
          }}
        >
          Previous Step
        </button>
      </div>
      <div>B</div>
      <div>{b.join(' | ')}</div>
    </div>
  )
}
