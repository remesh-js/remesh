import React, { useContext } from 'react'
import { useRemeshDomain, useRemeshEvent, useRemeshQuery } from 'remesh-react'
import { BoardRender } from './components/Board'
import { ChessRender } from './components/Chess'
import { MarkerRender } from './components/Marker'
import { GameConfigContext } from './context/game'

import { GameDomain } from './models/game'

export const ChessGame = () => {
  const { left, top, gridSize } = useContext(GameConfigContext)

  const domain = useRemeshDomain(GameDomain())
  const gameState = useRemeshQuery(domain.query.gameQuery())

  useRemeshEvent(domain.event.notYourMoveEvent, () => {
    alert('不该你走')
  })

  useRemeshEvent(domain.event.gameOverEvent, () => {
    const shouldRestart = window.confirm('游戏结束，是否重新开始？')
    if (shouldRestart) {
      domain.command.resetGameState()
    }
  })

  const style: React.HTMLAttributes<HTMLDivElement>['style'] = {
    width: left + 9 * gridSize,
    height: top + 10 * gridSize,
  }

  const { situation, markers } = gameState

  return (
    <div style={style}>
      <BoardRender />

      {situation.map((chess, i) => (
        <ChessRender key={i} chess={chess} onClick={() => domain.command.selectChess(chess)} />
      ))}

      {markers.map((marker, i) => (
        <MarkerRender key={i} marker={marker} onClick={() => domain.command.moveChess(marker)} />
      ))}
    </div>
  )
}
