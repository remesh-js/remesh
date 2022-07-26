import React from 'react'

import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import { CircleDrawerDomain, positionInCircle, Position } from 'remesh-domains-for-demos/dist/7guis/CircleDrawer'

import { OuterClickWrapper } from './OuterClickWrapper'

export const CircleDrawerApp = () => {
  const send = useRemeshSend()
  const domain = useRemeshDomain(CircleDrawerDomain())
  const drawState = useRemeshQuery(domain.query.DrawQuery())
  const tooltipsState = useRemeshQuery(domain.query.TooltipsQuery())
  const selectedCircleInfo = useRemeshQuery(domain.query.SelectedCircleInfoQuery())
  const canUndo = useRemeshQuery(domain.query.CanUndoQuery())
  const canRedo = useRemeshQuery(domain.query.CanRedoQuery())

  const getCircleInfo = (position: Position) => {
    const circle = drawState.circles.find((circle) => {
      return positionInCircle(position, circle)
    })

    if (!circle) {
      return null
    }

    const index = drawState.circles.indexOf(circle)

    return {
      index,
      circle,
    }
  }

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault()
    const position = { x: e.pageX, y: e.pageY }

    const circleInfo = getCircleInfo(position)

    if (circleInfo) {
      send([
        domain.command.SetSelectedIndexCommand(circleInfo.index),
        domain.command.UpdateTooltipsCommand({
          type: 'show-tips',
          index: circleInfo.index,
          circle: circleInfo.circle,
          pageX: e.pageX,
          pageY: e.pageY,
        }),
      ])
    }
  }

  const handleLeftClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (tooltipsState.type !== 'default') {
      return
    }

    const position = { x: e.pageX, y: e.pageY }
    const circleInfo = getCircleInfo(position)

    if (!circleInfo) {
      send(domain.command.DrawCommand({ position, diameter: 30 }))
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (tooltipsState.type !== 'default') {
      return
    }

    const position = { x: e.pageX, y: e.pageY }
    const circleInfo = getCircleInfo(position)

    if (circleInfo) {
      send(domain.command.SetSelectedIndexCommand(circleInfo.index))
    } else {
      send(domain.command.SetSelectedIndexCommand(-1))
    }
  }

  const handleOpenSlider = () => {
    if (tooltipsState.type === 'show-tips') {
      send(
        domain.command.UpdateTooltipsCommand({
          type: 'open-slider',
          index: tooltipsState.index,
          circle: tooltipsState.circle,
          pageX: tooltipsState.pageX,
          pageY: tooltipsState.pageY,
        }),
      )
    }
  }

  const handleCloseSlider = () => {
    send(
      domain.command.UpdateTooltipsCommand({
        type: 'default',
      }),
    )
  }

  const handleAdust = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10)

    if (selectedCircleInfo && !isNaN(value)) {
      send(
        domain.command.AdjustCommand({
          index: selectedCircleInfo.index,
          diameter: value,
        }),
      )
    }
  }

  return (
    <div
      style={{
        border: '1px solid #eaeaea',
        boxSizing: 'border-box',
        padding: 10,
      }}
    >
      <h2>Circle Drawer</h2>
      <div
        style={{
          width: 400,
          textAlign: 'center',
          padding: 10,
        }}
      >
        <button
          onClick={() => send(domain.command.UndoCommand())}
          style={{
            margin: '0 10px',
          }}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          onClick={() => send(domain.command.RedoCommand())}
          style={{
            margin: '0 10px',
          }}
          disabled={!canRedo}
        >
          Redo
        </button>
      </div>
      <div
        style={{
          width: 400,
          height: 400,
          border: '1px solid #eaeaea',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onClick={handleLeftClick}
        onMouseMove={handleMouseMove}
      >
        {drawState.circles.map((circle, index) => {
          return (
            <div
              key={circle.position.x + '-' + circle.position.y + '-' + circle.diameter}
              style={{
                position: 'absolute',
                left: circle.position.x - circle.diameter / 2,
                top: circle.position.y - circle.diameter / 2,
                width: circle.diameter,
                height: circle.diameter,
                borderRadius: circle.diameter / 2,
                border: '1px solid #666',
                backgroundColor: selectedCircleInfo?.index === index ? '#eaeaea' : '',
              }}
              onContextMenu={handleRightClick}
            ></div>
          )
        })}
      </div>
      {tooltipsState.type === 'show-tips' && (
        <OuterClickWrapper
          key="show-tips"
          style={{
            position: 'absolute',
            left: tooltipsState.pageX,
            top: tooltipsState.pageY,
            zIndex: 100,
            background: '#fff',
            border: '1px solid #666',
            padding: 10,
          }}
          onOuterClick={handleCloseSlider}
          onClick={handleOpenSlider}
        >
          Adjust Diameter
        </OuterClickWrapper>
      )}
      {tooltipsState.type === 'open-slider' && (
        <OuterClickWrapper
          key="open-slider"
          style={{
            position: 'absolute',
            left: tooltipsState.pageX,
            top: tooltipsState.pageY,
            background: '#fff',
            border: '1px solid #666',
            zIndex: 100,
            padding: 10,
          }}
          onOuterClick={handleCloseSlider}
        >
          <p>Adjust Diameter</p>
          <div>
            <input
              type="range"
              value={selectedCircleInfo?.circle.diameter ?? ''}
              min={1}
              max={150}
              onChange={handleAdust}
            />
          </div>
        </OuterClickWrapper>
      )}
    </div>
  )
}
