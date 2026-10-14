import { EngineError } from './errors';
import type { Board, Column, ColumnIndex, DieValue, GameState, Slot } from './types';

export const ALL_COLUMNS: readonly ColumnIndex[] = [0, 1, 2];
export const EMPTY_COLUMN: Column = [null, null, null];
export const EMPTY_BOARD: Board = [EMPTY_COLUMN, EMPTY_COLUMN, EMPTY_COLUMN];

/** Build a column from up to three dice, filled from slot 0. */
export function columnOf(...dice: readonly DieValue[]): Column {
  if (dice.length > 3) {
    throw new EngineError('COLUMN_FULL', 'A column holds at most three dice');
  }
  return [dice[0] ?? null, dice[1] ?? null, dice[2] ?? null];
}

export function boardOf(
  c0: Column = EMPTY_COLUMN,
  c1: Column = EMPTY_COLUMN,
  c2: Column = EMPTY_COLUMN,
): Board {
  return [c0, c1, c2];
}

/** The dice in a column, nearest-to-owner first. */
export function diceIn(column: Column): DieValue[] {
  return column.filter((slot): slot is DieValue => slot !== null);
}

export function countOf(column: Column, die: DieValue): number {
  let n = 0;
  for (const slot of column) {
    if (slot === die) n += 1;
  }
  return n;
}

/** Each distinct value v appearing n times scores v * n * n. */
export function scoreColumn(column: Column): number {
  let total = 0;
  for (const value of new Set(diceIn(column))) {
    const n = countOf(column, value);
    total += value * n * n;
  }
  return total;
}

export function scoreBoard(board: Board): number {
  return scoreColumn(board[0]) + scoreColumn(board[1]) + scoreColumn(board[2]);
}

export function scores(state: GameState): [number, number] {
  return [scoreBoard(state.boards[0]), scoreBoard(state.boards[1])];
}

export function isColumnFull(column: Column): boolean {
  return column[0] !== null && column[1] !== null && column[2] !== null;
}

export function isBoardFull(board: Board): boolean {
  return isColumnFull(board[0]) && isColumnFull(board[1]) && isColumnFull(board[2]);
}

export function legalColumns(board: Board): ColumnIndex[] {
  return ALL_COLUMNS.filter(c => !isColumnFull(board[c]));
}

/** Returns a new column with the die in the first open slot. Throws COLUMN_FULL. */
export function addDie(column: Column, die: DieValue): Column {
  const open = column.indexOf(null);
  if (open === -1) throw new EngineError('COLUMN_FULL');
  const next: [Slot, Slot, Slot] = [column[0], column[1], column[2]];
  next[open as 0 | 1 | 2] = die;
  return next;
}

export interface RemoveResult {
  readonly column: Column;
  readonly removed: DieValue[];
}

/** Removes every die of the given value and collapses the rest toward slot 0. */
export function removeValue(column: Column, die: DieValue): RemoveResult {
  const removed: DieValue[] = [];
  const kept: DieValue[] = [];
  for (const slot of column) {
    if (slot === null) continue;
    if (slot === die) removed.push(slot);
    else kept.push(slot);
  }
  if (removed.length === 0) return { column, removed };
  return { column: columnOf(...kept), removed };
}
