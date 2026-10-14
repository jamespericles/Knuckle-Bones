import { describe, expect, it } from 'vitest';
import { legalColumns } from './board';
import {
  GAME_LINK_PREFIX,
  MAX_MOVES,
  buildGameLink,
  decodeGame,
  encodeGame,
  extractGameCode,
  tryDecodeGame,
} from './codec';
import { CodecError } from './errors';
import { createGame, placeDie } from './game';
import { mulberry32 } from './rng';
import type { GameState } from './types';

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

function reasonOf(code: string): string | null {
  try {
    decodeGame(code);
    return null;
  } catch (e) {
    if (e instanceof CodecError) return e.reason;
    throw e;
  }
}

// Player 0 uses dice 1..3 and player 1 uses 4..6, so nothing is ever attacked and
// player 0 fills their board on the 17th move.
const FINISHED_MOVES = 'ADBECFGJHKILMPNQO';

describe('encodeGame', () => {
  it('encodes a new game in six characters', () => {
    const code = encodeGame(createGame({ id: 'k7f2', firstRoll: 5 }));
    expect(code).toBe('1k7f25');
  });

  it('encodes moves as A..R by column and die', () => {
    let state = createGame({ id: 'k7f2', firstRoll: 1 });
    state = placeDie(state, 0, { nextRoll: 6 }); // col 0 die 1 -> A
    state = placeDie(state, 2, { nextRoll: 3 }); // col 2 die 6 -> R
    expect(encodeGame(state)).toBe('1k7f2AR3');
  });

  it('writes 0 for the roll of a finished game and appends names when set', () => {
    const finished = decodeGame(`1abcd${FINISHED_MOVES}0`);
    expect(finished.status).toBe('finished');
    expect(encodeGame(finished)).toBe(`1abcd${FINISHED_MOVES}0`);
    const named = { ...createGame({ id: 'abcd', firstRoll: 2 }), names: ['Al, Jr', ''] as const };
    expect(encodeGame(named)).toBe('1abcd2,Al%2C%20Jr,');
  });
});

describe('round trips', () => {
  it.each([
    ['new game', playRandom(1, 0)],
    ['mid game', playRandom(2, 7)],
    ['finished game', playRandom(3)],
    ['with names', playRandom(4, 5, ['Zoë 🐑', "Bob's ~ (x)"])],
    ['one name', playRandom(6, 2, ['', 'Only Second'])],
  ])('%s', (_label, state) => {
    const code = encodeGame(state);
    expect(decodeGame(code)).toEqual(state);
    expect(encodeGame(decodeGame(code))).toBe(code);
  });

  it('truncates long names to 16 characters', () => {
    const state = {
      ...createGame({ id: 'abcd', firstRoll: 2 }),
      names: ['x'.repeat(40), ''] as const,
    };
    expect(decodeGame(encodeGame(state)).names[0]).toBe('x'.repeat(16));
  });

  it('keeps codes short', () => {
    expect(encodeGame(playRandom(1, 0))).toHaveLength(6);
    for (let seed = 1; seed <= 20; seed += 1) {
      const state = playRandom(seed);
      expect(encodeGame(state).length).toBe(6 + state.history.length);
    }
  });
});

describe('decodeGame rejects', () => {
  it.each([
    ['', 'empty'],
    ['2abcd5', 'bad-version'],
    ['1ab!d5', 'bad-id'],
    ['1ABCD5', 'bad-id'],
    ['1abc', 'bad-id'],
    ['1abcd', 'bad-roll'],
    ['1abcdS5', 'bad-move-char'],
    ['1abcda5', 'bad-move-char'],
    ['1abcdA 5', 'bad-move-char'],
    ['1abcd7', 'bad-roll'],
    ['1abcdAx', 'bad-roll'],
    [`1abcd${'A'.repeat(MAX_MOVES + 1)}1`, 'too-many-moves'],
    ['1abcdABABABA1', 'illegal-move'],
    [`1abcd${FINISHED_MOVES}R0`, 'move-after-finish'],
    [`1abcd${FINISHED_MOVES}5`, 'bad-roll'],
    ['1abcdA0', 'bad-roll'],
    ['1abcd0', 'bad-roll'],
    ['1abcd5,Al', 'bad-name'],
    ['1abcd5,Al,Bo,Cy', 'bad-name'],
    ['1abcd5,%E0%A4%A,Bo', 'bad-name'],
  ])('%s -> %s', (code, reason) => {
    expect(reasonOf(code)).toBe(reason);
  });

  it('allows a long legal game under the cap', () => {
    const code = `1abcd${'A'.repeat(MAX_MOVES)}1`;
    expect(decodeGame(code).history).toHaveLength(MAX_MOVES);
  });
});

describe('tryDecodeGame', () => {
  it('returns ok with the state', () => {
    const state = playRandom(8, 3);
    expect(tryDecodeGame(encodeGame(state))).toEqual({ ok: true, state });
  });

  it('returns the reason instead of throwing', () => {
    expect(tryDecodeGame('nope')).toEqual({ ok: false, reason: 'bad-version' });
  });
});

describe('links', () => {
  it('buildGameLink appends the hash route and drops an existing hash', () => {
    const state = createGame({ id: 'k7f2', firstRoll: 5 });
    expect(buildGameLink('https://x.y/app/', state)).toBe('https://x.y/app/#/g/1k7f25');
    expect(buildGameLink('https://x.y/app/#/play/pass', state)).toBe('https://x.y/app/#/g/1k7f25');
  });

  it('extractGameCode finds the code in a link or hash', () => {
    expect(extractGameCode('https://x.y/app/#/g/1k7f25')).toBe('1k7f25');
    expect(extractGameCode(`${GAME_LINK_PREFIX}1k7f25`)).toBe('1k7f25');
    expect(extractGameCode('#/play/pass')).toBeNull();
    expect(extractGameCode('#/g/')).toBeNull();
  });
});
