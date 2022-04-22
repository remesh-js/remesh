import React, { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'

import { Remesh } from 'remesh'

import { RemeshRoot } from 'remesh-react'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'
import { RemeshLogger } from 'remesh-logger'

import { ChessGame } from './ChessGame'
import { GameConfigContext } from './context/game'

const container = document.getElementById('root')

if (container) {
  const root = ReactDOMClient.createRoot(container)
  const store = Remesh.store({
    inspectors: [
      RemeshReduxDevtools(),
      RemeshLogger({
        include: ['command', 'query', 'event', 'domain', 'command$', 'state'],
      }),
    ],
  })

  root.render(
    <StrictMode>
      <RemeshRoot store={store}>
        <GameConfigContext.Provider
          value={{
            left: 0,
            top: 0,
            gridSize: 60,
            chessSize: 40,
          }}
        >
          <ChessGame />
        </GameConfigContext.Provider>
      </RemeshRoot>
    </StrictMode>,
  )
}
