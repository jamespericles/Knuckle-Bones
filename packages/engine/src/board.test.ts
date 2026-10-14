import { describe, expect, it } from 'vitest';
import {
  EMPTY_BOARD,
  EMPTY_COLUMN,
  addDie,
  boardOf,
  columnOf,
  countOf,
  isBoardFull,
  isColumnFull,
  legalColumns,
  removeValue,
  scoreBoard,
  scoreColumn,
  scores,
} from './board';
import { EngineError } from './errors';
import { createGame } from './game';
import type { DieValue } from './types';

const full = columnOf(1, 2, 3);

describe('scoreColumn', () => {
  it.each<[DieValue[], number]>([
    [[], 0],
    [[3], 3],
    [[4, 4], 16],
    [[4, 4, 4], 36],
    [[2, 5, 2], 13],
    [[6, 6, 6], 54],
    [[1, 2, 3], 6],
  ])('scores %j as %i', (dice, expected) => {
    expect(scoreColumn(columnOf(...dice))).toBe(expected);
  });
});

describe('scoreBoard and scores', () => {
  it('sums the three columns', () => {
    const board = boardOf(columnOf(4, 4), columnOf(1), columnOf(6, 6, 6));
    expect(scoreBoard(board)).toBe(16 + 1 + 54);
    expect(scoreBoard(EMPTY_BOARD)).toBe(0);
  });

  it('returns both players', () => {
    const state = {
      ...createGame({ firstRoll: 1 }),
      boards: [boardOf(columnOf(5)), boardOf(columnOf(2, 2))] as const,
    };
    expect(scores(state)).toEqual([5, 8]);
  });
});

describe('addDie', () => {
  it('fills slot 0, then 1, then 2', () => {
    const a = addDie(EMPTY_COLUMN, 3);
    expect(a).toEqual([3, null, null]);
    const b = addDie(a, 5);
    expect(b).toEqual([3, 5, null]);
    const c = addDie(b, 1);
    expect(c).toEqual([3, 5, 1]);
  });

  it('throws COLUMN_FULL on a fourth die and leaves the input alone', () => {
    const frozen = Object.freeze(columnOf(1, 2, 3));
    expect(() => addDie(frozen, 4)).toThrowError(EngineError);
    try {
      addDie(frozen, 4);
    } catch (e) {
      expect((e as EngineError).code).toBe('COLUMN_FULL');
    }
    expect(frozen).toEqual([1, 2, 3]);
  });
});

describe('removeValue', () => {
  it('removes matches and collapses toward slot 0', () => {
    const { column, removed } = removeValue(columnOf(4, 2, 4), 4);
    expect(column).toEqual([2, null, null]);
    expect(removed).toEqual([4, 4]);
  });

  it('returns the same column when nothing matches', () => {
    const input = columnOf(4, 2, 4);
    const { column, removed } = removeValue(input, 5);
    expect(column).toBe(input);
    expect(removed).toEqual([]);
  });

  it('clears a full column of matches', () => {
    const { column, removed } = removeValue(columnOf(4, 4, 4), 4);
    expect(column).toEqual([null, null, null]);
    expect(removed).toEqual([4, 4, 4]);
  });
});

describe('column and board state', () => {
  it('countOf counts a value', () => {
    expect(countOf(columnOf(4, 2, 4), 4)).toBe(2);
    expect(countOf(EMPTY_COLUMN, 4)).toBe(0);
  });

  it('isColumnFull needs all three slots', () => {
    expect(isColumnFull(EMPTY_COLUMN)).toBe(false);
    expect(isColumnFull(columnOf(1, 2))).toBe(false);
    expect(isColumnFull(full)).toBe(true);
  });

  it('legalColumns excludes full columns', () => {
    expect(legalColumns(EMPTY_BOARD)).toEqual([0, 1, 2]);
    expect(legalColumns(boardOf(full, columnOf(1), full))).toEqual([1]);
    expect(legalColumns(boardOf(full, full, full))).toEqual([]);
  });

  it('isBoardFull is true only with nine dice', () => {
    expect(isBoardFull(EMPTY_BOARD)).toBe(false);
    expect(isBoardFull(boardOf(full, full, columnOf(1, 2)))).toBe(false);
    expect(isBoardFull(boardOf(full, full, full))).toBe(true);
  });

  it('columnOf rejects more than three dice', () => {
    expect(() => columnOf(1, 2, 3, 4)).toThrowError(EngineError);
  });
});
