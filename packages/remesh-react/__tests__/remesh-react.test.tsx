import React from 'react'
import { act } from 'react-dom/test-utils'
import ReactDOM, { Root } from 'react-dom/client'

import { Remesh } from 'remesh'

import { RemeshRoot, useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from '../src/index'

// @ts-ignore config react testing environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
})
