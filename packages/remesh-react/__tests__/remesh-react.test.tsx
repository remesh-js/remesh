import { useState } from 'react'
import { act } from 'react-dom/test-utils'
import ReactDOM, { Root } from 'react-dom/client'
import { map } from 'rxjs/operators'

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

  it('should work', async () => {
    await act(() => {
      root.render(
        <RemeshRoot>
          <TestComponent />
        </RemeshRoot>,
      )
    })

    const count = document.getElementById('count') as HTMLDivElement
    expect(count.innerHTML).toBe('0')

    const button = container.querySelector('button') as HTMLButtonElement

    await act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(count.innerHTML).toBe('1')

    expect(countEventListener).toHaveBeenCalledTimes(1)
    expect(countEventListener).toHaveBeenCalledWith(1)
  })

  it('can use RemeshScope to keep domain alive', async () => {
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

    await act(() => {
      root.render(<App />)
    })

    const toggleButton = document.getElementById('toggle') as HTMLButtonElement
    let insideButton = document.getElementById('inside') as HTMLButtonElement
    let outsideButton = document.getElementById('outside') as HTMLButtonElement

    expect(insideButton.innerHTML).toBe('0')
    expect(outsideButton.innerHTML).toBe('0')

    await act(() => {
      insideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      outsideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(insideButton.innerHTML).toBe('1')
    expect(outsideButton.innerHTML).toBe('1')

    await act(() => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    insideButton = document.getElementById('inside') as HTMLButtonElement
    outsideButton = document.getElementById('outside') as HTMLButtonElement

    expect(insideButton).toBe(null)
    expect(outsideButton).toBe(null)

    await act(() => {
      toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    insideButton = document.getElementById('inside') as HTMLButtonElement
    outsideButton = document.getElementById('outside') as HTMLButtonElement

    expect(insideButton.innerHTML).toBe('1')
    expect(outsideButton.innerHTML).toBe('0')

    await act(() => {
      insideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      outsideButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(insideButton.innerHTML).toBe('2')
    expect(outsideButton.innerHTML).toBe('1')
  })

  it('can subscirbe domain-query via fromQuery and useRemeshQuery at the same time', async () => {
    const fn = jest.fn()
    const TestSubscribeDomain = Remesh.domain({
      name: 'TestSubscribeDomain',
      impl: (domain) => {
        const testDomain = domain.getDomain(TestDomain())

        domain.effect({
          name: 'TestSubscribeEffect',
          impl: ({ fromQuery }) => {
            return fromQuery(testDomain.query.CountQuery()).pipe(
              map((count) => {
                fn(`fromEffect: ${count}`)
                return null
              }),
            )
          },
        })

        return {
          ...testDomain,
        }
      },
    })

    const App = () => {
      const send = useRemeshSend()
      const domain = useRemeshDomain(TestSubscribeDomain())
      const count = useRemeshQuery(domain.query.CountQuery())

      const handleIncre = () => {
        send(domain.command.SetCountCommand(count + 1))
      }

      return (
        <div>
          <span id="count">{count}</span>
          <button id="incre" onClick={handleIncre}>
            +1
          </button>
        </div>
      )
    }

    await act(() => {
      root.render(
        <RemeshRoot>
          <App />
        </RemeshRoot>,
      )
    })

    const button = document.getElementById('incre') as HTMLButtonElement
    const countElem = document.getElementById('count') as HTMLSpanElement

    expect(countElem.textContent).toBe('0')

    await act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(countElem.textContent).toBe('1')
    expect(fn).toBeCalledWith(`fromEffect: 1`)
  })
})
