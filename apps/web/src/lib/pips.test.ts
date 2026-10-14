import { describe, expect, it } from 'vitest';
import type { DieValue } from '@knucklebones/engine';
import { CELLS, PIP_MAP, hasPip } from './pips';

describe('pips', () => {
  it('has as many pips as the face value', () => {
    for (const value of [1, 2, 3, 4, 5, 6] as DieValue[]) {
      expect(PIP_MAP[value]).toHaveLength(value);
      expect(CELLS.filter(cell => hasPip(value, cell))).toHaveLength(value);
    }
  });

  it('centres odd faces and leaves the centre empty on even faces', () => {
    expect(hasPip(1, 4)).toBe(true);
    expect(hasPip(3, 4)).toBe(true);
    expect(hasPip(5, 4)).toBe(true);
    expect(hasPip(2, 4)).toBe(false);
    expect(hasPip(4, 4)).toBe(false);
    expect(hasPip(6, 4)).toBe(false);
  });
});
