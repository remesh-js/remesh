import React from 'react'

import { Remesh } from 'remesh'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'

import { OuterClickWrapper } from './OuterClickWrapper'

type Position = { x: number; y: number }

type DrawAction = {
  position: Position
  diameter: number
}

type AdjustAction = {
  index: number
  diameter: number
}

type Circle = {
  position: Position
  diameter: number
}

type DrawState = {
  circles: Circle[]
}

type TooltipsState =
  | {
      type: 'default'
    }
  | {
      type: 'show-tips'
      index: number
      circle: Circle
      pageX: number
      pageY: number
    }
  | {
      type: 'open-slider'
      index: number
      circle: Circle
      pageX: number
      pageY: number
    }

type HistoryStateItem =
  | {
      action: 'add-circle'
      state: DrawState
    }
  | {
      action: 'adjust-circle'
      index: number
      state: DrawState
    }

type HistoryState = {
  items: HistoryStateItem[]
  currentIndex: number
}

const CircleDrawer = Remesh.domain({
  name: 'CircleDrawer',
  impl: (domain) => {
    const HistoryState = domain.state<HistoryState>({
      name: 'HistoryState',
      default: {
        items: [],
        currentIndex: -1,
      },
    })

    const recordHistoryState = domain.command({
      name: 'recordHistoryState',
      impl: ({ get }, state: HistoryStateItem) => {
        const history = get(HistoryState())

        const previousItems = history.items.slice(0, history.currentIndex + 1)

        /**
         * If the current state is the same as the last state,
         * then we don't need to record it.
         * This is because we are going to replace the last state
         * with the current state.
         *
         * This is a bit of a hack, but it works.
         *
         * TODO: Find a better way to do this.
         */
        if (state.action === 'adjust-circle') {
          const lastState = previousItems[previousItems.length - 1]
          if (lastState.action === 'adjust-circle' && lastState.index === state.index) {
            previousItems.pop()
          }
        }

        const newItems = [...previousItems, state]
        const newIndex = newItems.length - 1

        return HistoryState().new({
          items: newItems,
          currentIndex: newIndex,
        })
      },
    })

    const DrawState = domain.state<DrawState>({
      name: 'DrawState',
      default: {
        circles: [],
      },
    })

    const undo = domain.command({
      name: 'undo',
      impl: ({ get }) => {
        const history = get(HistoryState())
        const canUndo = get(canUndoQuery())
        const newIndex = history.currentIndex - 1

        if (!canUndo || newIndex < 0) {
          return [
            DrawState().new({
              circles: [],
            }),
            HistoryState().new({
              items: history.items,
              currentIndex: -1,
            }),
          ]
        }

        return [
          DrawState().new(history.items[newIndex].state),
          HistoryState().new({
            items: history.items,
            currentIndex: newIndex,
          }),
        ]
      },
    })

    const redo = domain.command({
      name: 'redo',
      impl: ({ get }) => {
        const history = get(HistoryState())
        const canRedo = get(canRedoQuery())

        if (!canRedo) {
          return []
        }

        const newIndex = history.currentIndex + 1

        return [
          DrawState().new(history.items[newIndex].state),
          HistoryState().new({
            items: history.items,
            currentIndex: newIndex,
          }),
        ]
      },
    })

    const canUndoQuery = domain.query({
      name: 'CanUndoQuery',
      impl: ({ get }) => {
        const history = get(HistoryState())
        return history.currentIndex >= 0
      },
    })

    const canRedoQuery = domain.query({
      name: 'CanRedoQuery',
      impl: ({ get }) => {
        const history = get(HistoryState())
        return history.currentIndex < history.items.length - 1
      },
    })

    const SelectedIndexState = domain.state<number>({
      name: 'SelectedIndexState',
      default: -1,
    })

    const setSelectedIndex = domain.command({
      name: 'setSelectedIndex',
      impl: ({}, index: number) => {
        return SelectedIndexState().new(index)
      },
    })

    const SelectedCircleInfoQuery = domain.query({
      name: 'SelectedCircleInfoQuery',
      impl: ({ get }) => {
        const index = get(SelectedIndexState())
        const circles = get(DrawState()).circles

        if (index === -1) {
          return null
        }

        return {
          index,
          circle: circles[index],
        }
      },
    })

    const draw = domain.command({
      name: 'draw',
      impl: ({ get }, action: DrawAction) => {
        const state = get(DrawState())
        const newState = {
          circles: [...state.circles, { position: action.position, diameter: action.diameter }],
        }
        return [
          DrawState().new(newState),
          recordHistoryState({
            action: 'add-circle',
            state: newState,
          }),
        ]
      },
    })

    const adjust = domain.command({
      name: 'adjust',
      impl: ({ get }, action: AdjustAction) => {
        const state = get(DrawState())
        const circles = state.circles.map((circle, index) => {
          if (index === action.index) {
            return {
              position: circle.position,
              diameter: action.diameter,
            }
          }
          return circle
        })

        const newState = {
          circles,
        }

        return [
          DrawState().new(newState),
          recordHistoryState({
            action: 'adjust-circle',
            index: action.index,
            state: newState,
          }),
        ]
      },
    })

    const TooltipsState = domain.state<TooltipsState>({
      name: 'TooltipsState',
      default: {
        type: 'default',
      },
    })

    const updateTooltips = domain.command({
      name: 'updateTooltips',
      impl: ({}, newState: TooltipsState) => {
        return TooltipsState().new(newState)
      },
    })

    return {
      query: {
        historyState: HistoryState.query,
        drawState: DrawState.query,
        tooltipsState: TooltipsState.query,
        selectedIndex: SelectedIndexState.query,
        selectedCircleInfo: SelectedCircleInfoQuery,
        canUndo: canUndoQuery,
        canRedo: canRedoQuery,
      },
      command: {
        draw,
        adjust,
        updateTooltips,
        undo,
        redo,
        setSelectedIndex,
      },
    }
  },
})

const positionInCircle = (position: Position, circle: Circle): boolean => {
  const { x, y } = position
  const { diameter, position: circlePosition } = circle
  const { x: circleX, y: circleY } = circlePosition
  const radius = diameter / 2
  const dx = x - circleX
  const dy = y - circleY

  return dx * dx + dy * dy < radius * radius
}

export const CircleDrawerApp = () => {
  const domain = useRemeshDomain(CircleDrawer())
  const drawState = useRemeshQuery(domain.query.drawState())
  const tooltipsState = useRemeshQuery(domain.query.tooltipsState())
  const selectedCircleInfo = useRemeshQuery(domain.query.selectedCircleInfo())
  const canUndo = useRemeshQuery(domain.query.canUndo())
  const canRedo = useRemeshQuery(domain.query.canRedo())

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
      domain.command.setSelectedIndex(circleInfo.index)
      domain.command.updateTooltips({
        type: 'show-tips',
        index: circleInfo.index,
        circle: circleInfo.circle,
        pageX: e.pageX,
        pageY: e.pageY,
      })
    }
  }

  const handleLeftClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (tooltipsState.type !== 'default') {
      return
    }

    const position = { x: e.pageX, y: e.pageY }
    const circleInfo = getCircleInfo(position)

    if (!circleInfo) {
      domain.command.draw({ position, diameter: 30 })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (tooltipsState.type !== 'default') {
      return
    }

    const position = { x: e.pageX, y: e.pageY }
    const circleInfo = getCircleInfo(position)

    if (circleInfo) {
      domain.command.setSelectedIndex(circleInfo.index)
    } else {
      domain.command.setSelectedIndex(-1)
    }
  }

  const handleOpenSlider = () => {
    if (tooltipsState.type === 'show-tips') {
      domain.command.updateTooltips({
        type: 'open-slider',
        index: tooltipsState.index,
        circle: tooltipsState.circle,
        pageX: tooltipsState.pageX,
        pageY: tooltipsState.pageY,
      })
    }
  }

  const handleCloseSlider = () => {
    console.log('handleCloseSlider')
    domain.command.updateTooltips({
      type: 'default',
    })
  }

  const handleAdust = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10)

    if (selectedCircleInfo && !isNaN(value)) {
      domain.command.adjust({
        index: selectedCircleInfo.index,
        diameter: value,
      })
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
          onClick={() => domain.command.undo()}
          style={{
            margin: '0 10px',
          }}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          onClick={() => domain.command.redo()}
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
