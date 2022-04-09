import React from 'react'

type GameConfigContextValue = {
  left: number
  top: number
  gridSize: number
  chessSize: number
}

export const GameConfigContext = React.createContext<GameConfigContextValue>({
  left: 0,
  top: 0,
  gridSize: 60,
  chessSize: 40,
})
