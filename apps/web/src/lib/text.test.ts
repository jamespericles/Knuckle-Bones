import { createGame } from '@knucklebones/engine';
import type { GameState } from '@knucklebones/engine';
import { describe, expect, it } from 'vitest';
import type { UiEvent } from '../state/gameReducer';
import { describeAttack, possessive, resultLine } from './text';

const names = ['You', 'CPU'] as const;

function event(removed: UiEvent['removed']): UiEvent {
  return { serial: 1, placed: { player: 0, column: 1, slot: 0, die: 5 }, removed };
}

describe('describeAttack', () => {
  it('returns null when nothing was removed', () => {
    expect(describeAttack(event(null), names)).toBeNull();
  });

  it('describes one, two and three dice', () => {
    expect(describeAttack(event({ player: 1, column: 1, die: 5, slots: [0] }), names)).toBe(
      "You cleared a 5 from CPU's column 2.",
    );
    expect(describeAttack(event({ player: 1, column: 1, die: 5, slots: [0, 2] }), names)).toBe(
      "You cleared two 5s from CPU's column 2.",
    );
    expect(describeAttack(event({ player: 1, column: 1, die: 5, slots: [0, 1, 2] }), names)).toBe(
      "You cleared three 5s from CPU's column 2.",
    );
  });

  it('uses "your" for the player called You', () => {
    const cpuMove: UiEvent = {
      serial: 2,
      placed: { player: 1, column: 0, slot: 0, die: 2 },
      removed: { player: 0, column: 0, die: 2, slots: [1] },
    };
    expect(describeAttack(cpuMove, names)).toBe('CPU cleared a 2 from your column 1.');
    expect(possessive('Ann')).toBe("Ann's");
  });
});

describe('resultLine', () => {
  const base = createGame({ id: 'abcd', firstRoll: 1 });
  const won: GameState = { ...base, status: 'finished', winner: 0, roll: null };
  const lost: GameState = { ...won, winner: 1 };
  const draw: GameState = { ...won, winner: 'draw' };

  it('speaks from the given seat', () => {
    expect(resultLine(won, names, 0)).toBe('You win!');
    expect(resultLine(lost, names, 0)).toBe('You lose.');
    expect(resultLine(won, names, 1)).toBe('You lose.');
  });

  it('names the winner when neutral', () => {
    expect(resultLine(won, ['Ann', 'Bo'], null)).toBe('Ann wins.');
    expect(resultLine(lost, ['Ann', 'Bo'], null)).toBe('Bo wins.');
  });

  it('handles a draw and a missing winner field', () => {
    expect(resultLine(draw, names, 0)).toBe('A draw.');
    expect(resultLine({ ...base, winner: null }, names, null)).toBe('A draw.');
  });
});
