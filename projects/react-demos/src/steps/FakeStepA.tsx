import * as React from 'react'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { FakeDomain } from './FakeDomain'
import { Steps, stepsAction } from './types'

export const FakeStepA = (props: { dispatch: React.Dispatch<stepsAction> }) => {
  const domain = useRemeshDomain(FakeDomain())

  const a = useRemeshQuery(domain.query.AQuery())
  const summary = useRemeshQuery(domain.query.SummaryQuery())

  return (
    <div>
      <div>
        <button
          onClick={() => {
            props.dispatch({ type: Steps.B })
          }}
        >
          Next Step
        </button>
      </div>
      <div>A</div>
      <div>{a}</div>
      <div>summary: {summary}</div>
    </div>
  )
}
