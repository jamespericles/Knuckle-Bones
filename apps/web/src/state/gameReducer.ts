import {
  applyMove,
  chooseCpuMove,
  createGame,
  diceIn,
  lastMove,
  legalColumns,
  opponentOf,
  replayHistory,
} from '@knucklebones/engine';
import type {
  ColumnIndex,
  Difficulty,
  DieValue,
  GameState,
  PlayerIndex,
  Rng,
} from '@knucklebones/engine';
import type { LocalMode } from './storage';

export interface PlacedEvent {
  readonly player: PlayerIndex;
  readonly column: ColumnIndex;
  readonly slot: number;
  readonly die: DieValue;
}

export interface RemovedEvent {
  readonly player: PlayerIndex;
  readonly column: ColumnIndex;
  readonly die: DieValue;
  /** Slots the removed dice occupied before the column collapsed. */
  readonly slots: readonly number[];
}

/** What changed in the last move, so the UI can animate it. */
export interface UiEvent {
  readonly serial: number;
  readonly placed: PlacedEvent;
  readonly removed: RemovedEvent | null;
}

export interface LocalState {
  readonly game: GameState;
  readonly mode: LocalMode;
  readonly difficulty: Difficulty;
  readonly event: UiEvent | null;
}

export type LocalAction =
  | { readonly type: 'place'; readonly column: ColumnIndex }
  | { readonly type: 'cpu-move' }
  | { readonly type: 'new-game' };

export const CPU_PLAYER: PlayerIndex = 1;

/** Describes the move the current player of `before` makes into `column`. */
export function describeMove(before: GameState, column: ColumnIndex, serial: number): UiEvent {
  const player = before.current;
  const die = before.roll ?? 1;
  const slot = diceIn(before.boards[player][column]).length;
  const opponent = opponentOf(player);
  const slots: number[] = [];
  before.boards[opponent][column].forEach((value, index) => {
    if (value === die) slots.push(index);
  });
  return {
    serial,
    placed: { player, column, slot, die },
    removed: slots.length > 0 ? { player: opponent, column, die, slots } : null,
  };
}

function move(state: LocalState, column: ColumnIndex, rng: Rng): LocalState {
  const { game } = state;
  if (game.status !== 'playing') return state;
  if (!legalColumns(game.boards[game.current]).includes(column)) return state;
  const next = applyMove(game, column, { rng }).state;
  const serial = (state.event?.serial ?? 0) + 1;
  return { ...state, game: next, event: describeMove(game, column, serial) };
}

export function makeLocalReducer(rng: Rng): (state: LocalState, action: LocalAction) => LocalState {
  return (state, action) => {
    switch (action.type) {
      case 'place':
        if (state.mode === 'cpu' && state.game.current === CPU_PLAYER) return state;
        return move(state, action.column, rng);
      case 'cpu-move':
        if (
          state.mode !== 'cpu' ||
          state.game.current !== CPU_PLAYER ||
          state.game.status !== 'playing'
        ) {
          return state;
        }
        return move(state, chooseCpuMove(state.game, state.difficulty, rng), rng);
      case 'new-game':
        return { ...state, game: createGame({ rng }), event: null };
    }
  };
}

/** The event that produced `game` from the state before it, for highlighting the last move. */
export function eventFromLastMove(game: GameState): UiEvent | null {
  const last = lastMove(game);
  if (!last) return null;
  const before = replayHistory(game).at(-2);
  if (!before) return null;
  return describeMove(before, last.column, game.history.length);
}
