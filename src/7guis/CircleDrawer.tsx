import React from 'react';

import { Remesh } from '../remesh';
import { useRemeshDomain, useRemeshQuery } from '../remesh/react';

import { OuterClickWrapper } from './OuterClickWrapper';

type Position = { x: number; y: number };

type DrawAction = {
  position: Position;
  diameter: number;
};

type AdjustAction = {
  index: number;
  diameter: number;
};

type Circle = {
  position: Position;
  diameter: number;
};

type DrawState = {
  circles: Circle[];
};

type TooltipsState =
  | {
      type: 'default';
    }
  | {
      type: 'show-tips';
      index: number;
      circle: Circle;
      pageX: number;
      pageY: number;
    }
  | {
      type: 'open-slider';
      index: number;
      circle: Circle;
      pageX: number;
      pageY: number;
    };

const CircleDrawer = Remesh.domain({
  name: 'CircleDrawer',
  impl: (domain) => {
    const HistoryState = domain.state<DrawState[]>({
      name: 'HistoryState',
      default: [],
    });

    const HistoryIndexState = domain.state<number>({
      name: 'HistoryIndexState',
      default: 0,
    });

    const addState = domain.command({
      name: 'addState',
      impl: ({ get }, state: DrawState) => {
        const history = get(HistoryState());
        const index = get(HistoryIndexState());
        const currentList = history.slice(0, index + 1);

        const newHistory = [...currentList, state];

        return [
          HistoryState().new(newHistory),
          HistoryIndexState().new(newHistory.length - 1),
        ];
      },
    });

    const DrawState = domain.state<DrawState>({
      name: 'DrawState',
      default: {
        circles: [],
      },
    });

    const replaceDrawState = domain.command({
      name: 'replaceDrawState',
      impl: ({}, state: DrawState) => {
        return DrawState().new(state);
      },
    });

    const undo = domain.command({
      name: 'undo',
      impl: ({ get }) => {
        const history = get(HistoryState());
        const index = get(HistoryIndexState());
        const newIndex = index - 1;

        if (newIndex < 0) {
          return [
            replaceDrawState({ circles: [] }),
            HistoryIndexState().new(-1),
          ];
        }

        return [
          replaceDrawState(history[newIndex]),
          HistoryIndexState().new(newIndex),
        ];
      },
    });

    const redo = domain.command({
      name: 'redo',
      impl: ({ get }) => {
        const history = get(HistoryState());
        const index = get(HistoryIndexState());

        if (index === history.length - 1) {
          return [];
        }

        const newIndex = index + 1;

        return [
          replaceDrawState(history[newIndex]),
          HistoryIndexState().new(newIndex),
        ];
      },
    });

    const CanUndoQuery = domain.query({
      name: 'CanUndoQuery',
      impl: ({ get }) => {
        const index = get(HistoryIndexState());
        return index >= 0;
      },
    });

    const CanRedoQuery = domain.query({
      name: 'CanRedoQuery',
      impl: ({ get }) => {
        const history = get(HistoryState());
        const index = get(HistoryIndexState());

        return index < history.length - 1;
      },
    });

    const SelectedIndexState = domain.state<number>({
      name: 'SelectedIndexState',
      default: -1,
    });

    const setSelectedIndex = domain.command({
      name: 'setSelectedIndex',
      impl: ({}, index: number) => {
        return SelectedIndexState().new(index);
      },
    });

    const SelectedCircleInfoQuery = domain.query({
      name: 'SelectedCircleInfoQuery',
      impl: ({ get }) => {
        const index = get(SelectedIndexState());
        const circles = get(DrawState()).circles;

        if (index === -1) {
          return null;
        }

        return {
          index,
          circle: circles[index],
        };
      },
    });

    const draw = domain.command({
      name: 'draw',
      impl: ({ get }, action: DrawAction) => {
        const state = get(DrawState());
        const newState = {
          circles: [
            ...state.circles,
            { position: action.position, diameter: action.diameter },
          ],
        };
        return [DrawState().new(newState), addState(newState)];
      },
    });

    const adjust = domain.command({
      name: 'adjust',
      impl: ({ get }, action: AdjustAction) => {
        const state = get(DrawState());
        const circles = state.circles.map((circle, index) => {
          if (index === action.index) {
            return {
              position: circle.position,
              diameter: action.diameter,
            };
          }
          return circle;
        });

        const newState = {
          circles,
        };

        return [DrawState().new(newState), addState(newState)];
      },
    });

    const TooltipsState = domain.state<TooltipsState>({
      name: 'TooltipsState',
      default: {
        type: 'default',
      },
    });

    const updateTooltips = domain.command({
      name: 'updateTooltips',
      impl: ({ get }, newState: TooltipsState) => {
        if (newState.type === 'open-slider') {
          return [TooltipsState().new(newState), addState(get(DrawState()))];
        }
        return TooltipsState().new(newState);
      },
    });

    return {
      query: {
        HistoryQuery: HistoryState.Query,
        DrawQuery: DrawState.Query,
        TooltipsQuery: TooltipsState.Query,
        SelectedIndexQuery: SelectedIndexState.Query,
        SelectedCircleInfoQuery: SelectedCircleInfoQuery,
        CanUndoQuery: CanUndoQuery,
        CanRedoQuery: CanRedoQuery,
      },
      command: {
        draw,
        adjust,
        updateTooltips,
        undo,
        redo,
        setSelectedIndex,
      },
    };
  },
});

const positionInCircle = (position: Position, circle: Circle): boolean => {
  const { x, y } = position;
  const { diameter, position: circlePosition } = circle;
  const { x: circleX, y: circleY } = circlePosition;
  const radius = diameter / 2;
  const dx = x - circleX;
  const dy = y - circleY;

  return dx * dx + dy * dy < radius * radius;
};

export const CircleDrawerApp = () => {
  const domain = useRemeshDomain(CircleDrawer);
  const drawState = useRemeshQuery(domain.query.DrawQuery());
  const tooltipsState = useRemeshQuery(domain.query.TooltipsQuery());
  const selectedCircleInfo = useRemeshQuery(
    domain.query.SelectedCircleInfoQuery()
  );
  const canUndo = useRemeshQuery(domain.query.CanUndoQuery());
  const canRedo = useRemeshQuery(domain.query.CanRedoQuery());

  const getCircleInfo = (position: Position) => {
    const circle = drawState.circles.find((circle) => {
      return positionInCircle(position, circle);
    });

    if (!circle) {
      return null;
    }

    const index = drawState.circles.indexOf(circle);

    return {
      index,
      circle,
    };
  };

  const handleRightClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.preventDefault();
    const position = { x: e.pageX, y: e.pageY };

    const circleInfo = getCircleInfo(position);

    if (circleInfo) {
      domain.command.setSelectedIndex(circleInfo.index);
      domain.command.updateTooltips({
        type: 'show-tips',
        index: circleInfo.index,
        circle: circleInfo.circle,
        pageX: e.pageX,
        pageY: e.pageY,
      });
    }
  };

  const handleLeftClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const position = { x: e.pageX, y: e.pageY };
    const circleInfo = getCircleInfo(position);

    if (circleInfo) {
      domain.command.setSelectedIndex(circleInfo.index);
    } else {
      domain.command.draw({ position, diameter: 30 });
    }
  };

  const handleOpenSlider = () => {
    if (tooltipsState.type === 'show-tips') {
      domain.command.updateTooltips({
        type: 'open-slider',
        index: tooltipsState.index,
        circle: tooltipsState.circle,
        pageX: tooltipsState.pageX,
        pageY: tooltipsState.pageY,
      });
    }
  };

  const handleCloseSlider = () => {
    e.stopPropagation()
    domain.command.updateTooltips({
      type: 'default',
    });
  };

  const handleAdust = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);

    if (selectedCircleInfo && !isNaN(value)) {
      domain.command.adjust({
        index: selectedCircleInfo.index,
        diameter: value,
      });
    }
  };
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
          padding: 10,
        }}
        onClick={handleLeftClick}
      >
        {drawState.circles.map((circle, index) => {
          return (
            <div
              key={
                circle.position.x +
                '-' +
                circle.position.y +
                '-' +
                circle.diameter
              }
              style={{
                position: 'absolute',
                left: circle.position.x - circle.diameter / 2,
                top: circle.position.y - circle.diameter / 2,
                width: circle.diameter,
                height: circle.diameter,
                borderRadius: circle.diameter / 2,
                border: '1px solid #666',
                backgroundColor:
                  selectedCircleInfo?.index === index ? '#eaeaea' : '',
              }}
              onContextMenu={handleRightClick}
            ></div>
          );
        })}
      </div>
      {tooltipsState.type === 'show-tips' && (
        <OuterClickWrapper
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
          onClick={handleOpenSlider}
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
  );
};
