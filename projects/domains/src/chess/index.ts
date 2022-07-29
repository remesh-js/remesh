import { Remesh } from 'remesh'
import { delay, filter, map } from 'rxjs/operators'

export enum ChessValue {
  General = 100,
  Chariot = 50,
  Cannon = 30,
  Horse = 29,
  Elephant = 16,
  Guard = 10,
  Soldier = 1,
}

export enum ChessColor {
  Red = 1,
  Black = -1,
}

export type Position = {
  x: number
  y: number
}

export type Chess = {
  color: ChessColor // 棋子什么颜色
  value: ChessValue // 是哪种棋子
  selected?: boolean // 是否被选中
  marked?: boolean // 是否被标记为可攻击
  position: Position // 当前位置
}

export type Marker = Position

export type Game = {
  currentPlayer: ChessColor
  selectedChess?: Chess
  situation: Chess[]
  markers: Marker[]
}

export type GameStatus = 'red-win' | 'black-win' | 'playing'

/**
 * 帮助函数
 */
/**
 * 判断两个位置是否相同
 * @param pos1 第一个位置
 * @param pos2 第二个位置
 * @returns boolean，是否相同
 */
const isSamePosition = (pos1: Position, pos2: Position) => {
  return pos1.x === pos2.x && pos1.y === pos2.y
}

/**
 * 将的位置是否合法
 * @param color 颜色
 * @param position 位置
 */
const isGeneralValid = (color: ChessColor, { x, y }: Position) => {
  switch (color) {
    case ChessColor.Black:
      return !(x < 3 || x > 5 || (y > 2 && y < 7))
    case ChessColor.Red:
      return !(x < 3 || x > 5 || (y > 2 && y < 7))
  }
}

/**
 * 士的位置是否合法
 * @param color 颜色
 * @param position 位置
 */
const isGuardValid = (color: ChessColor, { x, y }: Position) => {
  switch (color) {
    case ChessColor.Black:
      return [
        [3, 0],
        [3, 2],
        [5, 0],
        [5, 2],
        [4, 1],
      ].find(([x1, y1]) => x1 === x && y1 === y)
    case ChessColor.Red:
      return [
        [3, 7],
        [3, 9],
        [5, 7],
        [5, 9],
        [4, 8],
      ].find(([x1, y1]) => x1 === x && y1 === y)
  }
}

/**
 * 象的位置是否合法
 * @param color 颜色
 * @param position 位置
 */
const isElephantValid = (color: ChessColor, { x, y }: Position) => {
  switch (color) {
    case ChessColor.Black:
      return [
        [0, 2],
        [2, 0],
        [2, 4],
        [4, 2],
        [6, 0],
        [6, 4],
        [8, 2],
      ].find(([x1, y1]) => x1 === x && y1 === y)
    case ChessColor.Red:
      return [
        [0, 7],
        [2, 5],
        [2, 9],
        [4, 7],
        [6, 5],
        [6, 9],
        [8, 7],
      ].find(([x1, y1]) => x1 === x && y1 === y)
  }
}

/**
 * 兵的位置是否合法
 * @param color 颜色
 * @param position 位置
 */
const isSoldierValid = (color: ChessColor, { x, y }: Position) => {
  switch (color) {
    case ChessColor.Black:
      return !(y < 3 || (y < 5 && x % 2 === 1))
    case ChessColor.Red:
      return !(y > 6 || (y > 4 && x % 2 === 1))
  }
}

const canCannonAttack =
  (game: Game) =>
  ({ position: source }: Chess, { x, y }: Position) => {
    // 不在一条直线上，不能走
    if (source.x !== x && source.y !== y) {
      return false
    }

    // 先检测目标位置有无棋子
    if (game.situation.find((chess) => chess.position.x === x && chess.position.y === y)) {
      // 目标位置非空，吃子的逻辑，检测中间时候有且仅有一个棋子
      // 同一水平线
      if (source.y === y) {
        return (
          game.situation.filter(
            (chess) => chess.position.y === y && (chess.position.x - x) * (chess.position.x - source.x) < 0,
          ).length === 1
        )
      }

      // 同一竖直线
      if (source.x === x) {
        return (
          game.situation.filter(
            (chess) => chess.position.x === x && (chess.position.y - y) * (chess.position.y - source.y) < 0,
          ).length === 1
        )
      }
    }

    return false
  }

// 将可以去哪里吗
const canGeneralMove =
  () =>
  ({ position: source }: Chess, { x, y }: Position) => {
    return Math.abs(source.y - y) + Math.abs(source.x - x) === 1
  }

// 士可以去哪里吗
const canGuardMove =
  () =>
  ({ position: source }: Chess, { x, y }: Position) => {
    const square = (a: number) => a * a

    return square(source.x - x) + square(source.y - y) === 2
  }

// 象可以去哪里吗
const canElephantMove =
  (game: Game) =>
  ({ position: source }: Chess, { x, y }: Position) => {
    if (Math.abs(source.x - x) !== 2 || Math.abs(source.y - y) !== 2) {
      return false
    } else {
      // 象眼位置没有棋子
      return !game.situation.find(
        (chess) => chess.position.x === (source.x + x) / 2 && chess.position.y === (source.y + y) / 2,
      )
    }
  }

// 马可以去哪里吗
const canHorseMove =
  (game: Game) =>
  ({ position: source }: Chess, { x, y }: Position) => {
    const dx = source.x - x
    const dy = source.y - y

    // 马走日，并且马腿的位置没有棋子
    return (
      dx * dx + dy * dy === 5 &&
      !game.situation.find(
        (chess) =>
          chess.position.x === Math.round((2 * source.x + x) / 3) &&
          chess.position.y === Math.round((2 * source.y + y) / 3),
      )
    )
  }

// 能走直线吗
const canMoveStraightly =
  (game: Game) =>
  ({ position: source }: Chess, { x, y }: Position) => {
    // 不在一条直线上，不能走
    if (source.x !== x && source.y !== y) {
      return false
    }

    // 同一条水平线，中间无棋子
    if (source.y === y) {
      return !game.situation.find(
        (chess) => chess.position.y === y && (chess.position.x - x) * (chess.position.x - source.x) < 0,
      )
    }

    // 同一竖直线，中间无棋子
    if (source.x === x) {
      return !game.situation.find(
        (chess) => chess.position.x === x && (chess.position.y - y) * (chess.position.y - source.y) < 0,
      )
    }

    return false
  }

// 兵可以去哪里吗
const canSoldierMove =
  () =>
  ({ position: source, color }: Chess, { x, y }: Position) => {
    switch (color) {
      case ChessColor.Black:
        return y >= source.y && Math.abs(x - source.x) + Math.abs(y - source.y) === 1
      case ChessColor.Red:
        return y <= source.y && Math.abs(x - source.x) + Math.abs(y - source.y) === 1
    }
  }

/**
 * 判断在当前棋局下，某个棋子能否移动到目的位置，有些棋子的移动需要结合棋盘状态，此处不检测目标位置是否有棋子
 * @param game 棋盘状态
 */
const canMove = (game: Game) => (chess: Chess, position: Position) => {
  const { color, value } = chess
  switch (value) {
    case ChessValue.General:
      return isGeneralValid(color, position) && canGeneralMove()(chess, position)
    case ChessValue.Guard:
      return isGuardValid(color, position) && canGuardMove()(chess, position)
    case ChessValue.Elephant:
      return isElephantValid(color, position) && canElephantMove(game)(chess, position)
    case ChessValue.Horse:
      return canHorseMove(game)(chess, position)
    case ChessValue.Chariot:
      return canMoveStraightly(game)(chess, position)
    case ChessValue.Cannon:
      return canMoveStraightly(game)(chess, position)
    case ChessValue.Soldier:
      return isSoldierValid(color, position) && canSoldierMove()(chess, position)
  }
}

/**
 * 判断在当前棋局下，某个棋子能否攻击目标位置
 * @param game 棋盘状态
 */
const canAttack = (game: Game) => (chess: Chess, dest: Chess) => {
  if (chess.color === dest.color) {
    // 不能吃自己的棋子
    return false
  }

  if (chess.value === ChessValue.Cannon) {
    return canCannonAttack(game)(chess, dest.position)
  } else {
    return (
      game.situation.find((chess) => isSamePosition(chess.position, dest.position)) &&
      canMove(game)(chess, dest.position)
    )
  }
}

// 标记某个棋子为选中
const select = (chess: Chess) => {
  return {
    ...chess,
    selected: true,
  }
}

// 取消某个棋子的选中状态
const unselect = (chess: Chess) => {
  return {
    ...chess,
    selected: false,
  }
}

// 标记为可被攻击
const mark = (chess: Chess) => {
  return {
    ...chess,
    marked: true,
  }
}

// 取消可攻击状态
const unmark = (chess: Chess) => {
  return {
    ...chess,
    marked: false,
  }
}

/**
 * 移动棋子到指定位置
 * @param chess 待移动的棋子状态
 * @param position 位置
 */
const move = (position: Position) => {
  return (chess: Chess) => {
    return {
      ...chess,
      position,
    }
  }
}

/**
 * 在当前棋局中选中指定位置的棋子
 * @param position 目标位置
 */
const selectChessInGame =
  (position: Position) =>
  (game: Game): Game => {
    const { currentPlayer, situation } = game
    const { x, y } = position

    let newSelectedChess: Chess | undefined
    const newSituation = situation
      .map((chess) => unmark(unselect(chess)))
      .map((chess) => {
        if (chess.position.x === x && chess.position.y === y) {
          newSelectedChess = select(chess)
          return newSelectedChess
        } else {
          return chess
        }
      })
      .map((chess) => {
        if (canAttack(game)(newSelectedChess!, chess)) {
          return mark(chess)
        } else {
          return chess
        }
      })

    const markers: Marker[] = new Array(90)
      .fill(null)
      .map((v, index) => {
        const x = index % 9
        const y = (index - x) / 9
        return { x, y }
      })
      .filter((v) => canMove(game)(newSelectedChess!, v))

    return {
      currentPlayer,
      selectedChess: newSelectedChess,
      situation: newSituation,
      markers,
    }
  }

/**
 * 在当前棋局中，把选中的棋子移动到指定位置
 * @param position 目标位置
 */
const moveChessInGame =
  (position: Position) =>
  (game: Game): Game => {
    const { currentPlayer, situation, selectedChess } = game

    if (selectedChess && canMove(game)(selectedChess, position)) {
      const { x, y } = selectedChess.position
      const newSituation = situation
        .map((chess) => {
          if (chess.position.x === x && chess.position.y === y) {
            return move(position)(chess)
          } else {
            return chess
          }
        })
        // 走完之后，去掉棋子的选中和标记状态
        .map((chess) => unmark(unselect(chess)))

      return {
        currentPlayer: -currentPlayer,
        selectedChess: undefined,
        situation: newSituation,
        markers: [],
      }
    }
    return game
  }

/**
 * 在当前棋局中，用选中的棋子攻击指定位置
 * @param position 目标位置
 */
const attack =
  (position: Position) =>
  (game: Game): Game => {
    const { currentPlayer, situation, selectedChess } = game

    // 要攻击的棋子
    const dest = situation.find((chess) => chess.position.x === position.x && chess.position.y === position.y)

    if (selectedChess && dest && canAttack(game)(selectedChess, dest)) {
      const { x, y } = selectedChess.position
      const newSituation = situation
        .map((chess) => {
          // 吃别人的，自己移动到对方位置
          if (chess.position.x === x && chess.position.y === y) {
            return move(position)(chess)
          }

          // 被吃的，拿掉
          if (chess.position.x === position.x && chess.position.y === position.y) {
            return null
          }

          // 其他保持原样
          return chess
        })
        .filter((chess) => !!chess)
        // 走完之后，去掉棋子的选中和标记状态
        .map((chess) => unmark(unselect(chess as Chess)))

      return {
        currentPlayer: -currentPlayer,
        selectedChess: undefined,
        situation: newSituation,
        markers: [],
      }
    }
    return game
  }

const getGameStatus = (situation: Game['situation']): GameStatus => {
  const blackWin = !situation.some((chess) => {
    return chess.color === ChessColor.Red && chess.value === ChessValue.General
  })

  if (blackWin) {
    return 'black-win'
  }

  const redWin = !situation.some((chess) => {
    return chess.color === ChessColor.Black && chess.value === ChessValue.General
  })

  if (redWin) {
    return 'red-win'
  }

  return 'playing'
}

const defaultSituation: Chess[] = [
  { color: ChessColor.Black, value: ChessValue.Chariot, position: { x: 0, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Horse, position: { x: 1, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Elephant, position: { x: 2, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Guard, position: { x: 3, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.General, position: { x: 4, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Guard, position: { x: 5, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Elephant, position: { x: 6, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Horse, position: { x: 7, y: 0 } },
  { color: ChessColor.Black, value: ChessValue.Chariot, position: { x: 8, y: 0 } },

  { color: ChessColor.Black, value: ChessValue.Cannon, position: { x: 1, y: 2 } },
  { color: ChessColor.Black, value: ChessValue.Cannon, position: { x: 7, y: 2 } },

  { color: ChessColor.Black, value: ChessValue.Soldier, position: { x: 0, y: 3 } },
  { color: ChessColor.Black, value: ChessValue.Soldier, position: { x: 2, y: 3 } },
  { color: ChessColor.Black, value: ChessValue.Soldier, position: { x: 4, y: 3 } },
  { color: ChessColor.Black, value: ChessValue.Soldier, position: { x: 6, y: 3 } },
  { color: ChessColor.Black, value: ChessValue.Soldier, position: { x: 8, y: 3 } },

  { color: ChessColor.Red, value: ChessValue.Soldier, position: { x: 0, y: 6 } },
  { color: ChessColor.Red, value: ChessValue.Soldier, position: { x: 2, y: 6 } },
  { color: ChessColor.Red, value: ChessValue.Soldier, position: { x: 4, y: 6 } },
  { color: ChessColor.Red, value: ChessValue.Soldier, position: { x: 6, y: 6 } },
  { color: ChessColor.Red, value: ChessValue.Soldier, position: { x: 8, y: 6 } },

  { color: ChessColor.Red, value: ChessValue.Cannon, position: { x: 1, y: 7 } },
  { color: ChessColor.Red, value: ChessValue.Cannon, position: { x: 7, y: 7 } },

  { color: ChessColor.Red, value: ChessValue.Chariot, position: { x: 0, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Horse, position: { x: 1, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Elephant, position: { x: 2, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Guard, position: { x: 3, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.General, position: { x: 4, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Guard, position: { x: 5, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Elephant, position: { x: 6, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Horse, position: { x: 7, y: 9 } },
  { color: ChessColor.Red, value: ChessValue.Chariot, position: { x: 8, y: 9 } },
]

export const GameDomain = Remesh.domain({
  name: 'GameDomain',
  impl: (domain) => {
    const defaultGameState = {
      currentPlayer: ChessColor.Red,
      selectedChess: undefined,
      situation: defaultSituation,
      markers: [],
    }

    const GameState = domain.state<Game>({
      name: 'GameState',
      default: defaultGameState,
    })

    const GameQuery = domain.query({
      name: 'GameQuery',
      impl: ({ get }) => {
        return get(GameState())
      },
    })

    const GameStatusQuery = domain.query({
      name: 'GameStatusQuery',
      impl: ({ get }): GameStatus => {
        const { situation } = get(GameQuery())
        return getGameStatus(situation)
      },
    })

    const GameOverEvent = domain.event({
      name: 'GameOverEvent',
    })

    const NotYourMoveEvent = domain.event({
      name: 'NotYourMoveEvent',
    })

    const ResetGameStateCommand = domain.command({
      name: 'ResetGameStateCommand',
      impl: () => {
        return GameState().new(defaultGameState)
      },
    })

    const SelectChessCommand = domain.command({
      name: 'SelectChessCommand',
      impl({ get }, chess: Chess) {
        const gameStatus = get(GameStatusQuery())

        if (gameStatus !== 'playing') {
          return GameOverEvent()
        }

        const game = get(GameState())
        const { currentPlayer, selectedChess } = game

        if (chess.color === currentPlayer) {
          return [GameState().new(selectChessInGame(chess.position)(game))]
        } else {
          if (selectedChess) {
            return [GameState().new(attack(chess.position)(game))]
          } else {
            return [NotYourMoveEvent()]
          }
        }
      },
    })

    const MoveChessCommand = domain.command({
      name: 'MoveChessCommand',
      impl({ get }, position: Marker) {
        const gameStatus = get(GameStatusQuery())

        if (gameStatus !== 'playing') {
          return GameOverEvent()
        }

        const game = get(GameState())

        const { selectedChess } = game

        if (selectedChess) {
          return [GameState().new(moveChessInGame(position)(game))]
        } else {
          return [NotYourMoveEvent()]
        }
      },
    })

    domain.effect({
      name: 'CheckGameStatusEffect',
      impl: ({ fromQuery }) => {
        return fromQuery(GameStatusQuery()).pipe(
          filter((gameStatus) => gameStatus !== 'playing'),
          delay(100),
          map(() => GameOverEvent()),
        )
      },
    })

    return {
      query: {
        GameQuery,
        GameStatusQuery,
      },
      command: {
        SelectChessCommand,
        MoveChessCommand,
        ResetGameStateCommand,
      },
      event: {
        NotYourMoveEvent,
        GameOverEvent,
      },
    }
  },
})
