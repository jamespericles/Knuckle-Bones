import { describe, expect, it } from 'vitest';
import { ID_LENGTH, mulberry32, randomId, rollDie } from './rng';

describe('mulberry32', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const fromA = Array.from({ length: 10 }, () => a());
    const fromB = Array.from({ length: 10 }, () => b());
    const fromC = Array.from({ length: 10 }, () => c());
    expect(fromA).toEqual(fromB);
    expect(fromA).not.toEqual(fromC);
    for (const v of fromA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('rollDie', () => {
  it('only produces 1..6 and covers every face roughly evenly', () => {
    const rng = mulberry32(7);
    const counts = new Map<number, number>();
    for (let i = 0; i < 6000; i += 1) {
      const d = rollDie(rng);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const n of counts.values()) {
      expect(n).toBeGreaterThan(800);
      expect(n).toBeLessThan(1200);
    }
  });

  it('clamps edge values of the rng', () => {
    expect(rollDie(() => 0)).toBe(1);
    expect(rollDie(() => 0.999999)).toBe(6);
  });
});

describe('randomId', () => {
  it('produces four base36 characters, deterministic for a seed', () => {
    const id = randomId(mulberry32(1));
    expect(id).toHaveLength(ID_LENGTH);
    expect(id).toMatch(/^[0-9a-z]{4}$/);
    expect(randomId(mulberry32(1))).toBe(id);
  });
});
