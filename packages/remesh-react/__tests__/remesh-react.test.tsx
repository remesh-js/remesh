import React, { useState } from 'react'
import { act } from 'react-dom/test-utils'
import ReactDOM, { Root } from 'react-dom/client'

import { Remesh } from 'remesh'

import { RemeshRoot, RemeshScope, useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from '../src/index'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore config react testing environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('remesh-react', () => {
  let container!: HTMLDivElement
  let root!: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'root'
    document.body.appendChild(container)
    root = ReactDOM.createRoot(container)
  })

  afterEach(() => {
    root.unmount()
    document.body.removeChild(container)
  })

  const TestDomain = Remesh.domain({
    name: 'TestDomain',
    impl: (domain) => {
      const CountState = domain.state({
        name: 'CountState',
        default: 0,
      })

      const CountQuery = domain.query({
        name: 'CountQuery',
        impl: ({ get }) => {
          return get(CountState())
        },
      })

      const SetCountCommand = domain.command({
        name: 'SetCountCommand',
        impl: ({}, count: number) => {
          return [CountState().new(count), CountEvent(count)]
        },
      })

      const CountEvent = domain.event<number>({
        name: 'CountEvent',
      })

      return {
        query: {
          CountQuery,
        },
        command: {
          SetCountCommand,
        },
        event: {
          CountEvent,
        },
      }
    },
  })

  const countEventListener = jest.fn()

  const TestComponent = () => {
    const send = useRemeshSend()
    const countDomain = useRemeshDomain(TestDomain())
    const count = useRemeshQuery(countDomain.query.CountQuery())

    const handleClick = () => {
      send(countDomain.command.SetCountCommand(count + 1))
    }

    useRemeshEvent(countDomain.event.CountEvent, countEventListener)

    return (
      <div id="container">
        <div id="count">{count}</div>
        <button onClick={handleClick}>Click me</button>
      </div>
    )
  }

  it('should work', () => {
    act(() => {
      root.render(
        <RemeshRoot>
          <TestComponent />
        </RemeshRoot>,
      )
    })

    const count = document.getElementById('count') as HTMLDivElement
    expect(count.innerHTML).toBe('0')

    const button = container.querySelector('button') as HTMLButtonElement

    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(count.innerHTML).toBe('1')

    expect(countEventListener).toHaveBeenCalledTimes(1)
    expect(countEventListener).toHaveBeenCalledWith(1)
  })

  it('can use RemeshScope to keep domain alive', () => {
    const TestScopeDomain = Remesh.domain({
      name: 'TestScopeDomain',
      impl: (domain) => {
        const AState = domain.state({
          name: 'AState',
          default: 0,
        })

        const AQuery = domain.query({
          name: 'AQuery',
          impl: ({ get }) => {
            return get(AState())
          },
        })

        const ACommand = domain.command({
          name: 'ACommand',
          impl: ({}, value: number) => {
            return AState().new(value)
          },
        })

        return {
          query: {
            AQuery,
          },
          command: {
            ACommand,
          },
        }
      },
    })

    const A = (props: { id: string }) => {
      const send = useRemeshSend()
      const testScopeDomain = useRemeshDomain(TestScopeDomain())
      const a = useRemeshQuery(testScopeDomain.query.AQuery())

      const handleClick = () => {
        send(testScopeDomain.command.ACommand(a + 1))
      }

      return (
        <button id={props.id} onClick={handleClick}>
          {a}
        </button>
      )
    }

    const App = () => {
      const [state, setState] = useState(true)

      const handleClick = () => {
        setState(!state)
      }

      return (
        <div id="container">
          <button onClick={handleClick} id="toggle">
            toggle
          </button>
          <RemeshRoot>{state && <A id="outside" />}</RemeshRoot>
          <RemeshRoot>
            <RemeshScope domains={[TestScopeDomain()]}>{state && <A id="inside" />}</RemeshScope>
          </RemeshRoot>
        </div>
      )
    }

    act(() => {
      root.render(<App />)
    })

    const toggleButton = document.getElementById('toggle') as HTMLButtonElement
    let insideButton = document.getElementById('inside') as HTMLButtonElement
    let outsideButton = document.getElementById('outside') as HTMLButtonElement

    expect(insideButton.innerHTML).toBe('0')
    expect(outsideButton.innerHTML).toBe('0')

    act(() => {
      insideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      outsideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(insideButton.innerHTML).toBe('1')
    expect(outsideButton.innerHTML).toBe('1')

    act(() => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    insideButton = document.getElementById('inside') as HTMLButtonElement
    outsideButton = document.getElementById('outside') as HTMLButtonElement

    expect(insideButton).toBe(null)
    expect(outsideButton).toBe(null)

    act(() => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    insideButton = document.getElementById('inside') as HTMLButtonElement
    outsideButton = document.getElementById('outside') as HTMLButtonElement

    expect(insideButton.innerHTML).toBe('1')
    expect(outsideButton.innerHTML).toBe('0')

    act(() => {
      insideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      outsideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(insideButton.innerHTML).toBe('2')
    expect(outsideButton.innerHTML).toBe('1')
  })
})
