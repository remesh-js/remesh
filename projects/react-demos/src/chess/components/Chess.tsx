import React, { useContext } from 'react'
import { Chess, ChessColor, ChessValue } from 'remesh-domains-for-demos/dist/chess'
import { GameConfigContext } from '../context/game'

const formatChessColor = (color: ChessColor) => {
  return { [ChessColor.Red]: 'red', [ChessColor.Black]: 'black' }[color]
}

const formatChessValue = (color: ChessColor, value: ChessValue) => {
  return {
    [ChessColor.Red]: {
      [ChessValue.General]: '帅',
      [ChessValue.Guard]: '仕',
      [ChessValue.Elephant]: '相',
      [ChessValue.Horse]: '馬',
      [ChessValue.Chariot]: '車',
      [ChessValue.Cannon]: '炮',
      [ChessValue.Soldier]: '兵',
    },
    [ChessColor.Black]: {
      [ChessValue.General]: '将',
      [ChessValue.Guard]: '士',
      [ChessValue.Elephant]: '象',
      [ChessValue.Horse]: '马',
      [ChessValue.Chariot]: '车',
      [ChessValue.Cannon]: '砲',
      [ChessValue.Soldier]: '卒',
    },
  }[color][value]
}

type ChessProps = {
  chess: Chess
  onClick: (chess: Chess) => void
}

export const ChessRender = (props: ChessProps) => {
  const { chess, onClick } = props

  const {
    color,
    value,
    position: { x, y },
    selected,
    marked,
  } = chess

  const { chessSize, gridSize, left, top } = useContext(GameConfigContext)

  const style: React.HTMLAttributes<HTMLDivElement>['style'] = {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'white',
    fontSize: 26,
    textAlign: 'center',
    borderWidth: 2,
    width: chessSize,
    height: chessSize,
    cursor: 'pointer',
    left: left + x * gridSize + (gridSize - chessSize) / 2 - 2,
    top: top + y * gridSize + (gridSize - chessSize) / 2 - 2,
    borderStyle: selected ? 'dashed' : 'solid',
    borderColor: marked ? 'aqua' : formatChessColor(color),
    borderRadius: chessSize / 2 + 1,
    color: formatChessColor(color),
  }

  return (
    <div onClick={() => onClick(chess)} style={style}>
      {formatChessValue(color, value)}
    </div>
  )
}
