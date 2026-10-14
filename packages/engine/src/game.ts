import { EMPTY_BOARD, addDie, isBoardFull, removeValue, scoreBoard } from './board';
import { EngineError } from './errors';
import { defaultRng, randomId, rollDie } from './rng';
import type {
  Board,
  Column,
  ColumnIndex,
  DieValue,
  GameState,
  Move,
  PlayerIndex,
  Rng,
} from './types';

export interface CreateGameOptions {
  readonly id?: string | undefined;
  readonly names?: readonly [string, string] | undefined;
  /** The die player 0 must place first. Rolled with `rng` when omitted. */
  readonly firstRoll?: DieValue | undefined;
  readonly rng?: Rng | undefined;
}

export function createGame(opts: CreateGameOptions = {}): GameState {
  const rng = opts.rng ?? defaultRng;
  return {
    id: opts.id ?? randomId(rng),
    boards: [EMPTY_BOARD, EMPTY_BOARD],
    current: 0,
    roll: opts.firstRoll ?? rollDie(rng),
    status: 'playing',
    winner: null,
    history: [],
    names: opts.names ?? ['', ''],
  };
}

export function opponentOf(player: PlayerIndex): PlayerIndex {
  return player === 0 ? 1 : 0;
}

export function isColumnIndex(value: unknown): value is ColumnIndex {
  return value === 0 || value === 1 || value === 2;
}

export function winnerOf(boards: readonly [Board, Board]): PlayerIndex | 'draw' {
  const a = scoreBoard(boards[0]);
  const b = scoreBoard(boards[1]);
  if (a === b) return 'draw';
  return a > b ? 0 : 1;
}

export interface ApplyMoveOptions {
  /** The die the next player must place. Rolled with `rng` when omitted. */
  readonly nextRoll?: DieValue | undefined;
  readonly rng?: Rng | undefined;
}

export interface ApplyMoveResult {
  readonly state: GameState;
  /** Dice the attack removed from the opponent's facing column. */
  readonly removed: DieValue[];
}

function replaceColumn(board: Board, index: ColumnIndex, column: Column): Board {
  const next: [Column, Column, Column] = [board[0], board[1], board[2]];
  next[index] = column;
  return next;
}

/**
 * The current player places `state.roll` into `column`. Applies the attack on the
 * opponent's facing column, ends the game if either board is full, otherwise hands
 * the turn over with the next roll. Never mutates its input.
 */
export function applyMove(
  state: GameState,
  column: ColumnIndex,
  opts: ApplyMoveOptions = {},
): ApplyMoveResult {
  if (state.status === 'finished') throw new EngineError('GAME_OVER');
  if (!isColumnIndex(column)) throw new EngineError('INVALID_COLUMN');
  const die = state.roll;
  if (die === null) throw new EngineError('NO_ROLL');

  const me = state.current;
  const opp = opponentOf(me);
  const myBoard = state.boards[me];
  const oppBoard = state.boards[opp];

  const myColumn = addDie(myBoard[column], die);
  const attack = removeValue(oppBoard[column], die);
  const newMine = replaceColumn(myBoard, column, myColumn);
  const newTheirs = replaceColumn(oppBoard, column, attack.column);
  const boards: [Board, Board] = me === 0 ? [newMine, newTheirs] : [newTheirs, newMine];

  const move: Move = { player: me, column, die };
  const history = [...state.history, move];

  if (isBoardFull(newMine) || isBoardFull(newTheirs)) {
    return {
      state: {
        ...state,
        boards,
        history,
        status: 'finished',
        winner: winnerOf(boards),
        roll: null,
      },
      removed: attack.removed,
    };
  }

  const nextRoll = opts.nextRoll ?? rollDie(opts.rng ?? defaultRng);
  return {
    state: { ...state, boards, history, current: opp, roll: nextRoll },
    removed: attack.removed,
  };
}

export function placeDie(
  state: GameState,
  column: ColumnIndex,
  opts: ApplyMoveOptions = {},
): GameState {
  return applyMove(state, column, opts).state;
}

export function lastMove(state: GameState): Move | null {
  return state.history.at(-1) ?? null;
}

/** 1 for the first move of the game. */
export function turnNumber(state: GameState): number {
  return state.history.length + 1;
}

/**
 * Rebuilds every state from the start of the game to `state`, using the recorded
 * history. The last element equals `state` for any state the engine produced.
 */
export function replayHistory(state: GameState): GameState[] {
  const first = state.history[0];
  if (!first) return [state];

  let current = createGame({ id: state.id, names: state.names, firstRoll: first.die });
  const states: GameState[] = [current];
  state.history.forEach((move, i) => {
    const nextRoll = state.history[i + 1]?.die ?? state.roll ?? undefined;
    current = placeDie(current, move.column, { nextRoll });
    states.push(current);
  });
  return states;
}
