import { act } from 'react-dom/test-utils'
import { map } from 'rxjs/operators'

import { Remesh } from 'remesh'

import { RemeshRoot, useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend, RemeshScope } from '../src'
import ReactDOM, { Root } from 'react-dom/client'
import { delay } from './utils'

const SendCodeDomain = Remesh.domain({
  name: 'SendCodeDomain',
  impl(domain) {
    const SuccessEvent = domain.event({
      name: 'SuccessEvent',
    })

    const SendCommand = domain.command({
      name: 'SendCommand',
      impl() {
        return [SuccessEvent()]
      },
    })

    return {
      command: {
        SendCommand,
      },
      event: {
        SuccessEvent,
      },
    }
  },
})

const PageDomain = Remesh.domain({
  name: 'PageDomain',
  impl(domain) {
    const PageState = domain.state({
      name: 'PageState',
      default: {
        step: 'conflict' as 'additional' | 'conflict',
      },
    })

    const PageQuery = domain.query({
      name: 'PageQuery',
      impl({ get }) {
        return get(PageState())
      },
    })

    const BackCommand = domain.command({
      name: 'BackCommand',
      impl() {
        return PageState().new({ step: 'conflict' })
      },
    })

    const CreateCommand = domain.command({
      name: 'CreateCommand',
      impl() {
        return PageState().new({ step: 'additional' })
      },
    })

    return {
      query: {
        PageQuery,
      },
      command: {
        BackCommand,
        CreateCommand,
      },
    }
  },
})

describe('remesh-react-event', () => {
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

  it('can subscribe domain-query via fromQuery and useRemeshQuery at the same time', async () => {
    const effectFn = jest.fn()
    const useRemeshEventFn = jest.fn()

    const AdditionalDomain = Remesh.domain({
      name: 'AdditionalDomain',
      impl(domain) {
        const sendCodeDomain = domain.getDomain(SendCodeDomain())

        const SendCodeCommand = domain.command({
          name: 'SendCodeCommand',
          impl() {
            return sendCodeDomain.command.SendCommand()
          },
        })

        domain.effect({
          name: 'SendCodeEffect',
          impl({ fromEvent }) {
            return fromEvent(sendCodeDomain.event.SuccessEvent).pipe(
              map(() => {
                console.log('receive event in effect')
                effectFn()
                return []
              }),
            )
          },
        })

        return {
          command: {
            SendCodeCommand,
          },
          event: {
            SendCodeSuccessEvent: sendCodeDomain.event.SuccessEvent,
          },
        }
      },
    })

    function Additional() {
      const send = useRemeshSend()
      const domain = useRemeshDomain(AdditionalDomain())

      useRemeshEvent(domain.event.SendCodeSuccessEvent, () => {
        useRemeshEventFn()
        console.log('receive event in Additional View')
      })

      return (
        <div
          onClick={() => {
            send(domain.command.SendCodeCommand())
          }}
          id={'send-code'}
        >
          Send Code
        </div>
      )
    }
    function Page() {
      const send = useRemeshSend()
      const domain = useRemeshDomain(PageDomain())
      const { step } = useRemeshQuery(domain.query.PageQuery())

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            id={'back'}
            onClick={() => {
              send(domain.command.BackCommand())
            }}
          >
            Back
          </div>
          {step === 'conflict' && (
            <div
              id={'conflict'}
              onClick={() => {
                send(domain.command.CreateCommand())
              }}
            >
              Expand
            </div>
          )}

          {step === 'additional' && <Additional />}
        </div>
      )
    }

    const store = Remesh.store()
    await act(() => {
      root.render(
        <RemeshRoot store={store}>
          <RemeshScope domains={[AdditionalDomain(), SendCodeDomain()]}>
            <Page />
          </RemeshScope>
        </RemeshRoot>,
      )
    })

    await act(() => {
      const conflictButton = document.getElementById('conflict') as HTMLButtonElement
      conflictButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      sendCode.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(effectFn).toBeCalledTimes(1)
    expect(useRemeshEventFn).toBeCalledTimes(1)

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      expect(sendCode).not.toBe(null)
    })

    await act(() => {
      const backButton = document.getElementById('back') as HTMLButtonElement
      backButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await delay(2000)

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      expect(sendCode).toBe(null)
    })

    await act(() => {
      const conflictButton = document.getElementById('conflict') as HTMLButtonElement
      conflictButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      sendCode.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(effectFn).toBeCalledTimes(2)
    expect(useRemeshEventFn).toBeCalledTimes(2)
  })
})
