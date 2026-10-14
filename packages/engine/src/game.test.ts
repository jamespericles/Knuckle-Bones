import { describe, expect, it } from 'vitest';
import { EMPTY_BOARD, boardOf, columnOf, legalColumns } from './board';
import { EngineError } from './errors';
import {
  applyMove,
  createGame,
  lastMove,
  opponentOf,
  placeDie,
  replayHistory,
  turnNumber,
  winnerOf,
} from './game';
import { mulberry32 } from './rng';
import type { Board, DieValue, GameState, PlayerIndex } from './types';

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const v of Object.values(value as object)) deepFreeze(v);
  }
  return value;
}

function stateWith(
  boards: readonly [Board, Board],
  current: PlayerIndex = 0,
  roll: DieValue = 1,
): GameState {
  return deepFreeze({ ...createGame({ id: 'test', firstRoll: roll }), boards, current });
}

function playRandom(seed: number, moves = Infinity, names?: [string, string]): GameState {
  const rng = mulberry32(seed);
  let state = createGame({ rng, names });
  for (let i = 0; i < moves && state.status === 'playing'; i += 1) {
    const legal = legalColumns(state.boards[state.current]);
    const column = legal[Math.floor(rng() * legal.length)];
    if (column === undefined) throw new Error('no legal column');
    state = placeDie(state, column, { rng });
  }
  return state;
}

describe('createGame', () => {
  it('starts empty with player 0 to move', () => {
    const state = createGame({ firstRoll: 3, id: 'abcd' });
    expect(state).toEqual({
      id: 'abcd',
      boards: [EMPTY_BOARD, EMPTY_BOARD],
      current: 0,
      roll: 3,
      status: 'playing',
      winner: null,
      history: [],
      names: ['', ''],
    });
  });

  it('rolls and picks an id from the rng when not given', () => {
    const a = createGame({ rng: mulberry32(9) });
    const b = createGame({ rng: mulberry32(9) });
    expect(a).toEqual(b);
    expect(a.id).toMatch(/^[0-9a-z]{4}$/);
    expect(a.roll).toBeGreaterThanOrEqual(1);
  });
});

describe('placeDie', () => {
  it('places the roll in the current player column and hands over the turn', () => {
    const start = stateWith([EMPTY_BOARD, EMPTY_BOARD], 0, 4);
    const next = placeDie(start, 1, { nextRoll: 2 });
    expect(next.boards[0][1]).toEqual([4, null, null]);
    expect(next.boards[1]).toEqual(EMPTY_BOARD);
    expect(next.current).toBe(1);
    expect(next.roll).toBe(2);
    expect(next.history).toEqual([{ player: 0, column: 1, die: 4 }]);
    expect(next.status).toBe('playing');
  });

  it('rolls the next die from the rng when nextRoll is omitted', () => {
    const start = stateWith([EMPTY_BOARD, EMPTY_BOARD], 0, 4);
    expect(placeDie(start, 0, { rng: () => 0.99 }).roll).toBe(6);
    expect(placeDie(start, 0, { rng: () => 0 }).roll).toBe(1);
  });

  it('removes only matching dice from the facing opponent column', () => {
    const theirs = boardOf(columnOf(4, 2, 4), columnOf(4, 4), columnOf(1));
    const mine = boardOf(columnOf(4), columnOf(2), columnOf(3));
    const start = stateWith([mine, theirs], 0, 4);
    const next = placeDie(start, 0, { nextRoll: 1 });
    expect(next.boards[0][0]).toEqual([4, 4, null]);
    expect(next.boards[1][0]).toEqual([2, null, null]);
    expect(next.boards[1][1]).toEqual([4, 4, null]);
    expect(next.boards[1][2]).toEqual([1, null, null]);
    expect(next.boards[0][1]).toEqual([2, null, null]);
  });

  it('works symmetrically for player 1', () => {
    const p0 = boardOf(columnOf(5, 5), columnOf(1), columnOf(1));
    const start = stateWith([p0, EMPTY_BOARD], 1, 5);
    const next = placeDie(start, 0, { nextRoll: 3 });
    expect(next.boards[1][0]).toEqual([5, null, null]);
    expect(next.boards[0][0]).toEqual([null, null, null]);
    expect(next.current).toBe(0);
  });

  it('throws COLUMN_FULL for a full column without mutating', () => {
    const mine = boardOf(columnOf(1, 2, 3), columnOf(1), columnOf(1));
    const start = stateWith([mine, EMPTY_BOARD], 0, 6);
    expect(() => placeDie(start, 0)).toThrowError(EngineError);
    expect(start.boards[0][0]).toEqual([1, 2, 3]);
    expect(start.history).toEqual([]);
  });

  it('throws INVALID_COLUMN for out-of-range input', () => {
    const start = stateWith([EMPTY_BOARD, EMPTY_BOARD], 0, 6);
    expect(() => placeDie(start, 3 as never)).toThrowError(/INVALID_COLUMN/);
  });

  it('ends the game the moment the mover fills their board', () => {
    const mine = boardOf(columnOf(1, 2, 3), columnOf(1, 2, 3), columnOf(1, 2));
    const start = stateWith([mine, EMPTY_BOARD], 0, 5);
    const end = placeDie(start, 2, { nextRoll: 1 });
    expect(end.status).toBe('finished');
    expect(end.roll).toBeNull();
    expect(end.winner).toBe(0);
    expect(end.current).toBe(0);
    expect(() => placeDie(end, 0)).toThrowError(/GAME_OVER/);
  });

  it('ends the game when the opponent board is full after the move', () => {
    const theirs = boardOf(columnOf(1, 2, 3), columnOf(1, 2, 3), columnOf(1, 2, 3));
    const start = stateWith([EMPTY_BOARD, theirs], 0, 6);
    const end = placeDie(start, 0, { nextRoll: 1 });
    expect(end.status).toBe('finished');
    expect(end.winner).toBe(1);
  });

  it('declares a draw on equal totals', () => {
    const mine = boardOf(columnOf(1, 2, 3), columnOf(1, 2, 3), columnOf(1, 2));
    const theirs = boardOf(columnOf(5, 5), columnOf(1), columnOf());
    const start = stateWith([mine, theirs], 0, 6);
    const end = placeDie(start, 2);
    expect(end.winner).toBe('draw');
    expect(winnerOf(end.boards)).toBe('draw');
  });
});

describe('applyMove', () => {
  it('reports what the attack removed', () => {
    const theirs = boardOf(columnOf(3, 3, 1));
    const start = stateWith([EMPTY_BOARD, theirs], 0, 3);
    const { state, removed } = applyMove(start, 0, { nextRoll: 2 });
    expect(removed).toEqual([3, 3]);
    expect(state.boards[1][0]).toEqual([1, null, null]);
  });

  it('reports nothing when the attack misses', () => {
    const start = stateWith([EMPTY_BOARD, EMPTY_BOARD], 0, 3);
    expect(applyMove(start, 0, { nextRoll: 2 }).removed).toEqual([]);
  });
});

describe('history helpers', () => {
  it('tracks the turn number and last move', () => {
    const start = createGame({ firstRoll: 2, id: 'abcd' });
    expect(turnNumber(start)).toBe(1);
    expect(lastMove(start)).toBeNull();
    const next = placeDie(start, 2, { nextRoll: 4 });
    expect(turnNumber(next)).toBe(2);
    expect(lastMove(next)).toEqual({ player: 0, column: 2, die: 2 });
    expect(opponentOf(0)).toBe(1);
    expect(opponentOf(1)).toBe(0);
  });

  it('replayHistory rebuilds every state up to the input', () => {
    const final = playRandom(11, 7, ['Ann', 'Bo']);
    const states = replayHistory(final);
    expect(states).toHaveLength(final.history.length + 1);
    expect(states.at(-1)).toEqual(final);
    states.forEach((s, i) => {
      expect(s.history).toEqual(final.history.slice(0, i));
      expect(s.id).toBe(final.id);
      expect(s.names).toEqual(final.names);
    });
  });

  it('replayHistory handles a finished game', () => {
    const final = playRandom(5);
    expect(final.status).toBe('finished');
    expect(replayHistory(final).at(-1)).toEqual(final);
  });

  it('replayHistory of a fresh game is just that game', () => {
    const start = createGame({ firstRoll: 2, id: 'abcd' });
    expect(replayHistory(start)).toEqual([start]);
  });
});

describe('random games', () => {
  it('always finish with a full board and a consistent winner', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const final = playRandom(seed);
      expect(final.status).toBe('finished');
      expect(final.roll).toBeNull();
      expect(final.winner).toBe(winnerOf(final.boards));
      const anyFull = final.boards.some(b => b.every(c => c.every(s => s !== null)));
      expect(anyFull).toBe(true);
    }
  });
});

describe('guards', () => {
  it('throws NO_ROLL when a playing state has no die to place', () => {
    const start: GameState = { ...createGame({ id: 'abcd', firstRoll: 2 }), roll: null };
    expect(() => placeDie(start, 0)).toThrowError(/NO_ROLL/);
  });
});
