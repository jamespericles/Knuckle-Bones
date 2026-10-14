import type { DieValue } from '@knucklebones/engine';

/** Which cells of a 3x3 grid (row-major, 0..8) carry a pip for each die face. */
export const PIP_MAP: Readonly<Record<DieValue, readonly number[]>> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export const CELLS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function hasPip(value: DieValue, cell: number): boolean {
  return PIP_MAP[value].includes(cell);
}
