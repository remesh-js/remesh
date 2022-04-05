import React, { useContext } from 'react'
import { GameConfigContext } from '../context/game'

// 棋盘画线辅助计算
const createPathArr = (config: { left: number; top: number; gridSize: number }) => {
  const { left: baseLeft, top: baseTop, gridSize } = config

  const left = baseLeft + gridSize / 2
  const top = baseTop + gridSize / 2

  // 生成线的路径
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    return `M${left + x1 * gridSize},${top + y1 * gridSize} L${left + x2 * gridSize},${top + y2 * gridSize}`
  }

  // 生成十字花
  const star = (x: number, y: number) => {
    const arr = []
    const distance = 1 / 10
    const length = 1 / 4

    let startX, startY, endX, endY

    // 左边画一半
    if (x != 0) {
      startX = x - distance
      startY = y - distance - length
      endX = x - distance - length
      endY = y - distance

      arr.push(line(startX, startY, startX, endY))
      arr.push(line(startX, endY, endX, endY))

      startY = y + distance + length
      endY = y + distance

      arr.push(line(startX, startY, startX, endY))
      arr.push(line(startX, endY, endX, endY))
    }

    // 右边画一半
    if (x != 8) {
      startX = x + distance
      startY = y - distance - length
      endX = x + distance + length
      endY = y - distance

      arr.push(line(startX, startY, startX, endY))
      arr.push(line(startX, endY, endX, endY))

      startY = y + distance + length
      endY = y + distance

      arr.push(line(startX, startY, startX, endY))
      arr.push(line(startX, endY, endX, endY))
    }

    return arr
  }

  const arr: string[] = [
    // 炮位
    [1, 2],
    [7, 2],
    [1, 7],
    [7, 7],
    // 兵位
    [0, 3],
    [2, 3],
    [4, 3],
    [6, 3],
    [8, 3],
    [0, 6],
    [2, 6],
    [4, 6],
    [6, 6],
    [8, 6],
  ]
    .map(([x, y]) => star(x, y))
    .reduce((acc, cur) => acc.concat(cur), [])
    // 横线
    .concat(new Array(8).fill(0).map((_, i) => line(0, i + 1, 8, i + 1)))
    // 竖线，被楚河汉界分成两段
    .concat(new Array(7).fill(0).map((_, i) => line(i + 1, 0, i + 1, 4)))
    .concat(new Array(7).fill(0).map((_, i) => line(i + 1, 5, i + 1, 9)))
    // 九宫格的线
    .concat([line(3, 0, 5, 2), line(5, 0, 3, 2), line(3, 7, 5, 9), line(3, 9, 5, 7)])

  return arr
}

export const BoardRender = () => {
  const config = useContext(GameConfigContext)

  const { left: baseLeft, top: baseTop, gridSize, chessSize } = config

  const left = baseLeft + gridSize / 2
  const top = baseTop + gridSize / 2
  const width = gridSize * 8
  const height = gridSize * 9

  const pathArr = createPathArr(config)

  const svgStyle: React.SVGAttributes<SVGSVGElement>['style'] = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width + chessSize,
    height: height + chessSize,
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
      <g>
        <rect x={left} y={top} width={width} height={height} fill="none" stroke="#000000" strokeWidth="3"></rect>
        {pathArr.map((path, i) => (
          <path key={i} fill="none" stroke="#000000" d={path}></path>
        ))}
      </g>
    </svg>
  )
}
