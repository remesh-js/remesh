import React, { useContext } from 'react'
import { useRemeshDomain, useRemeshEvent, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { BoardRender } from './components/Board'
import { ChessRender } from './components/Chess'
import { MarkerRender } from './components/Marker'
import { GameConfigContext } from './context/game'

import { GameDomain } from 'remesh-domains-for-demos/dist/chess'

export const ChessGame = () => {
  const send = useRemeshSend()
  const { left, top, gridSize } = useContext(GameConfigContext)

  const domain = useRemeshDomain(GameDomain())
  const gameState = useRemeshQuery(domain.query.GameQuery())

  useRemeshEvent(domain.event.NotYourMoveEvent, () => {
    alert('不该你走')
  })

  useRemeshEvent(domain.event.GameOverEvent, () => {
    const shouldRestart = window.confirm('游戏结束，是否重新开始？')
    if (shouldRestart) {
      send(domain.command.ResetGameStateCommand())
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
        <ChessRender key={i} chess={chess} onClick={() => send(domain.command.SelectChessCommand(chess))} />
      ))}

      {markers.map((marker, i) => (
        <MarkerRender key={i} marker={marker} onClick={() => send(domain.command.MoveChessCommand(marker))} />
      ))}
    </div>
  )
}
