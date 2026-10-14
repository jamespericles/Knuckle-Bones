import type { DieValue, Rng } from './types';

/** Small, fast seeded PRNG. Same seed, same sequence. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRng: Rng = () => Math.random();

export function rollDie(rng: Rng = defaultRng): DieValue {
  const value = 1 + Math.floor(rng() * 6);
  return Math.min(6, Math.max(1, value)) as DieValue;
}

export const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
export const ID_LENGTH = 4;

export function randomId(rng: Rng = defaultRng): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i += 1) {
    id += ID_ALPHABET.charAt(Math.floor(rng() * ID_ALPHABET.length));
  }
  return id;
}
