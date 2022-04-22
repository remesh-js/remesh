import { Remesh } from 'remesh'

export type Position = { x: number; y: number }

export type DrawAction = {
  position: Position
  diameter: number
}

export type AdjustAction = {
  index: number
  diameter: number
}

export type Circle = {
  position: Position
  diameter: number
}

export type DrawState = {
  circles: Circle[]
}

export type TooltipsState =
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

export type HistoryStateItem =
  | {
      action: 'add-circle'
      state: DrawState
    }
  | {
      action: 'adjust-circle'
      index: number
      state: DrawState
    }

export type HistoryState = {
  items: HistoryStateItem[]
  currentIndex: number
}

export const CircleDrawer = Remesh.domain({
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

export const positionInCircle = (position: Position, circle: Circle): boolean => {
  const { x, y } = position
  const { diameter, position: circlePosition } = circle
  const { x: circleX, y: circleY } = circlePosition
  const radius = diameter / 2
  const dx = x - circleX
  const dy = y - circleY

  return dx * dx + dy * dy < radius * radius
}
