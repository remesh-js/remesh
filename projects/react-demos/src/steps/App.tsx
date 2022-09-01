import * as React from 'react'
import './style.css'
import { FakeModal } from './FakeModal'

export default function App() {
  const [visible, setVisible] = React.useState(false)
  return (
    <div>
      <h1>Steps</h1>
      <button onClick={() => setVisible(!visible)}>{!visible ? 'Open Modal' : 'Close Modal'}</button>
      {visible && <FakeModal />}
    </div>
  )
}
