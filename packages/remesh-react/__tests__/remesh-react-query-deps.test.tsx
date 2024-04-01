import { act } from 'react-dom/test-utils'
import { interval } from 'rxjs'
import { map, startWith, switchMap, take, tap } from 'rxjs/operators'

import { Remesh } from 'remesh'

import React, { useState } from 'react'
import ReactDOM, { Root } from 'react-dom/client'
import { RemeshRoot, RemeshScope, useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from '../src'
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

const COUNTDOWN_SECONDS = 5

jest.setTimeout(15 * 1000)
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
    const triggerEffectFn = jest.fn()
    const eventEffectFn = jest.fn()
    const queryEffectFn = jest.fn()
    const useRemeshEventFn = jest.fn()

    const AdditionalDomain = Remesh.domain({
      name: 'AdditionalDomain',
      impl(domain, id: number) {
        const sendCodeDomain = domain.getDomain(SendCodeDomain())

        const SendCodeCommand = domain.command({
          name: 'SendCodeCommand',
          impl() {
            return sendCodeDomain.command.SendCommand()
          },
        })

        const SendCodeState = domain.state({
          name: 'SendCodeState',
          default: {
            tick: 0,
          },
        })

        const SendCodeQuery = domain.query({
          name: 'SendCodeQuery',
          impl({ get }) {
            const state = get(SendCodeState())
            return { tick: state.tick, disabled: state.tick > 0 }
          },
        })

        const UpdateSendCodeCommand = domain.command({
          name: 'UpdateSendCodeCommand',
          impl(_, tick: number) {
            return SendCodeState().new({ tick })
          },
        })

        domain.effect({
          name: 'SendCodeEffect',
          impl({ fromEvent }) {
            return fromEvent(sendCodeDomain.event.SuccessEvent).pipe(
              tap((v) => {
                triggerEffectFn()
                console.log('receive event in effect')
              }),
              switchMap(() =>
                interval(1000)
                  .pipe(
                    map((tick) => COUNTDOWN_SECONDS - tick - 1),
                    take(COUNTDOWN_SECONDS),
                  )
                  .pipe(startWith(COUNTDOWN_SECONDS)),
              ),
              tap((tick) => {
                console.log('tick', tick)
                eventEffectFn()
              }),
              map((tick) => [UpdateSendCodeCommand(tick)]),
            )
          },
        })

        domain.effect({
          name: 'PrintTickEffect',
          impl({ fromQuery }) {
            return fromQuery(SendCodeQuery()).pipe(
              tap((state) => {
                console.log('got query update:', JSON.stringify(state))
                queryEffectFn()
              }),
              map((state) => []),
            )
          },
        })

        return {
          query: {
            SendCodeQuery,
          },
          command: {
            SendCodeCommand,
          },
          event: {
            SendCodeSuccessEvent: sendCodeDomain.event.SuccessEvent,
          },
        }
      },
    })

    function Additional({ id }: { id: number }) {
      console.log('get prop id:', id)
      const send = useRemeshSend()
      const domain = useRemeshDomain(AdditionalDomain(id))

      useRemeshEvent(domain.event.SendCodeSuccessEvent, () => {
        useRemeshEventFn()
        console.log('receive event in Additional View')
      })

      const state = useRemeshQuery(domain.query.SendCodeQuery())

      return (
        <div>
          <button
            id={'send-code'}
            disabled={state.disabled}
            onClick={() => {
              send(domain.command.SendCodeCommand())
            }}
          >
            <>Send Code</>
            <>({state.tick})</>
          </button>
        </div>
      )
    }
    function Page() {
      const send = useRemeshSend()
      const domain = useRemeshDomain(PageDomain())
      const { step } = useRemeshQuery(domain.query.PageQuery())
      const [id, setId] = useState(0)

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
                setId((id) => id + 1)
                send(domain.command.CreateCommand())
              }}
            >
              Expand
            </div>
          )}

          {step === 'additional' && <Additional id={id} />}
        </div>
      )
    }

    const store = Remesh.store()
    await act(() => {
      root.render(
        <RemeshRoot store={store}>
          <RemeshScope domains={[AdditionalDomain(1)]}>
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

    expect(triggerEffectFn).toBeCalledTimes(1)
    expect(useRemeshEventFn).toBeCalledTimes(1)

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      expect(sendCode).not.toBe(null)
    })

    await delay(2600)
    expect(queryEffectFn).toBeCalledTimes(3)
    expect(eventEffectFn).toBeCalledTimes(3)

    await act(() => {
      const backButton = document.getElementById('back') as HTMLButtonElement
      backButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      expect(sendCode).toBe(null)
    })

    await act(() => {
      const conflictButton = document.getElementById('conflict') as HTMLButtonElement
      conflictButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await delay(2600)
    expect(queryEffectFn).toBeCalledTimes(6)
    expect(eventEffectFn).toBeCalledTimes(6)

    await act(() => {
      const sendCode = document.getElementById('send-code') as HTMLSpanElement
      sendCode.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await delay(200)
    expect(triggerEffectFn).toBeCalledTimes(3)
    expect(useRemeshEventFn).toBeCalledTimes(2)

    await delay(2600)

    await act(() => {
      const backButton = document.getElementById('back') as HTMLButtonElement
      backButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await delay(2600)
    expect(queryEffectFn).toBeCalledTimes(15)
    expect(eventEffectFn).toBeCalledTimes(15)

    expect(triggerEffectFn).toBeCalledTimes(3)
    expect(useRemeshEventFn).toBeCalledTimes(2)
  })
})
