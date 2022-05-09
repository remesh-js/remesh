import { NextPageContext } from 'next'

import { Remesh, PreloadedState } from 'remesh'
import { RemeshRoot, useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { PreloadDomain } from '../domains/PreloadDomain'
import React from 'react'

export type Props = {
  preloadedState: PreloadedState
}

export async function getServerSideProps(_context: NextPageContext) {
  const store = Remesh.store()

  await store.preload(PreloadDomain())

  const preloadedState = store.getPreloadedState()

  return {
    props: {
      preloadedState: preloadedState,
    }, // will be passed to the page component as props
  }
}

export default (props: Props) => {
  return (
    <RemeshRoot
      options={{
        name: 'PreloadTest',
        preloadedState: props.preloadedState,
        inspectors: [RemeshReduxDevtools(), RemeshLogger()],
      }}
    >
      <Counter />
    </RemeshRoot>
  )
}

const Counter = () => {
  const domain = useRemeshDomain(PreloadDomain())
  const state = useRemeshQuery(domain.query.CountQuery())

  const incre = () => {
    domain.command.IncreCommand()
  }

  const decre = () => {
    domain.command.DecreCommand()
  }

  return (
    <div>
      <h1 className="h-10 text-center">{state.count}</h1>
      <div className="h-10 text-center">
        <Button onClick={incre}>+</Button>
        <Button onClick={decre}>-</Button>
      </div>
    </div>
  )
}

export type ButtonProps = {
  children: React.ReactNode,
  onClick: () => unknown
}

const Button = (props: ButtonProps) => {
  return (
    <button
      className="mx-3 bg-black hover:bg-white hover:text-black border border-black text-white font-bold py-3 px-12 lg:px-8 duration-200 transition-colors mb-6 lg:mb-0"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}
