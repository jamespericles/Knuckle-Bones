import { describe, expect, it } from 'vitest';
import { EMPTY_BOARD, boardOf, columnOf, legalColumns } from './board';
import { CPU_WEIGHTS, chooseCpuMove, evaluateColumn } from './cpu';
import { createGame, placeDie } from './game';
import { mulberry32 } from './rng';
import type { Board, DieValue, GameState, PlayerIndex } from './types';

function stateWith(
  boards: readonly [Board, Board],
  current: PlayerIndex = 0,
  roll: DieValue = 1,
): GameState {
  return { ...createGame({ id: 'test', firstRoll: roll }), boards, current };
}

describe('chooseCpuMove easy', () => {
  it('only ever returns a legal column', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 200; i += 1) {
      const mine = boardOf(
        i % 3 === 0 ? columnOf(1, 2, 3) : columnOf(1),
        i % 3 === 1 ? columnOf(4, 5, 6) : columnOf(),
        i % 3 === 2 ? columnOf(2, 2, 2) : columnOf(6),
      );
      const state = stateWith([mine, EMPTY_BOARD], 0, 4);
      const column = chooseCpuMove(state, 'easy', rng);
      expect(legalColumns(mine)).toContain(column);
    }
  });
});

describe('chooseCpuMove normal', () => {
  it('takes the big attack', () => {
    const theirs = boardOf(columnOf(1), columnOf(6, 6, 6), columnOf(1));
    const state = stateWith([EMPTY_BOARD, theirs], 0, 6);
    expect(chooseCpuMove(state, 'normal', mulberry32(1))).toBe(1);
  });

  it('completes its own triple when there is nothing to attack', () => {
    const mine = boardOf(columnOf(1), columnOf(2), columnOf(5, 5));
    const state = stateWith([mine, EMPTY_BOARD], 0, 5);
    expect(chooseCpuMove(state, 'normal', mulberry32(1))).toBe(2);
  });

  it('prefers the column the opponent can no longer attack', () => {
    const theirs = boardOf(columnOf(1, 2, 3), columnOf(), columnOf());
    const state = stateWith([EMPTY_BOARD, theirs], 0, 4);
    expect(chooseCpuMove(state, 'normal', mulberry32(1))).toBe(0);
  });

  it('returns the only legal column when forced', () => {
    const mine = boardOf(columnOf(1, 2, 3), columnOf(1), columnOf(4, 5, 6));
    const state = stateWith([mine, EMPTY_BOARD], 0, 2);
    expect(chooseCpuMove(state, 'normal', mulberry32(1))).toBe(1);
    expect(chooseCpuMove(state, 'easy', mulberry32(1))).toBe(1);
  });

  it('is deterministic for a seed', () => {
    const state = createGame({ firstRoll: 3, id: 'abcd' });
    expect(chooseCpuMove(state, 'normal', mulberry32(5))).toBe(
      chooseCpuMove(state, 'normal', mulberry32(5)),
    );
  });

  it('plays as player 1 too', () => {
    const p0 = boardOf(columnOf(2, 2, 2), columnOf(), columnOf());
    const state = stateWith([p0, EMPTY_BOARD], 1, 2);
    expect(chooseCpuMove(state, 'normal', mulberry32(1))).toBe(0);
  });

  it('throws once the game is over', () => {
    const mine = boardOf(columnOf(1, 2, 3), columnOf(1, 2, 3), columnOf(1, 2));
    const end = placeDie(stateWith([mine, EMPTY_BOARD], 0, 5), 2);
    expect(() => chooseCpuMove(end)).toThrowError(/GAME_OVER/);
  });
});

describe('evaluateColumn', () => {
  it('values a pair as gain minus exposure', () => {
    const mine = boardOf(columnOf(4), columnOf(), columnOf());
    const state = stateWith([mine, EMPTY_BOARD], 0, 4);
    expect(evaluateColumn(state, 0)).toBeCloseTo(12 - CPU_WEIGHTS.exposure * 4 * 4);
    expect(evaluateColumn(state, 1)).toBeCloseTo(4 - CPU_WEIGHTS.exposure * 4);
  });

  it('adds what the attack removes', () => {
    const theirs = boardOf(columnOf(3, 3), columnOf(), columnOf());
    const state = stateWith([EMPTY_BOARD, theirs], 0, 3);
    expect(evaluateColumn(state, 0)).toBeCloseTo(3 + 12 - CPU_WEIGHTS.exposure * 3);
  });
});

describe('guards', () => {
  it('evaluateColumn throws NO_ROLL without a die', () => {
    const state: GameState = { ...createGame({ id: 'abcd', firstRoll: 2 }), roll: null };
    expect(() => evaluateColumn(state, 0)).toThrowError(/NO_ROLL/);
  });
});
