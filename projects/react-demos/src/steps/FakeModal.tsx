import { RemeshScope } from 'remesh-react'
import { FakeDomain } from './FakeDomain'

import { FakeStepsContainer } from './FakeStepsContainer'

export const FakeModal = () => {
  return (
    <div style={{ border: '1px solid #eaeaea', margin: '0 auto', width: 300, padding: 10 }}>
      <RemeshScope domains={[FakeDomain()]}>
        <FakeStepsContainer />
      </RemeshScope>
    </div>
  )
}
