import React, { useContext } from 'react'
import { GameConfigContext } from '../context/game'
import { Marker } from '../models/game'

type MarkerProps = {
  marker: Marker
  onClick: (marker: Marker) => void
}

export const MarkerRender = (props: MarkerProps) => {
  const { marker, onClick } = props
  const { x, y } = marker

  const { chessSize, gridSize, left, top } = useContext(GameConfigContext)

  const style: React.HTMLAttributes<HTMLDivElement>['style'] = {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'green',
    backgroundColor: 'white',
    width: chessSize / 2,
    height: chessSize / 2,
    left: left + x * gridSize + chessSize / 4 + (gridSize - chessSize) / 2 - 2,
    top: top + y * gridSize + chessSize / 4 + (gridSize - chessSize) / 2 - 2,
  }

  return <div onClick={() => onClick(marker)} style={style} />
}
