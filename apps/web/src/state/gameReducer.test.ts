import { boardOf, columnOf, createGame, placeDie } from '@knucklebones/engine';
import type { Difficulty, GameState } from '@knucklebones/engine';
import { describe, expect, it } from 'vitest';
import { describeMove, eventFromLastMove, makeLocalReducer } from './gameReducer';
import type { LocalState } from './gameReducer';
import type { LocalMode } from './storage';

// A constant rng rolls a 4 every time.
const rng = () => 0.5;

function local(
  game: GameState,
  mode: LocalMode = 'pass',
  difficulty: Difficulty = 'normal',
): LocalState {
  return { game, mode, difficulty, event: null };
}

/** Player 0 stacks two 5s in column 0, then player 1 holds a 5 to wipe them. */
function attackSetup(): GameState {
  let game = createGame({ id: 'abcd', firstRoll: 5 });
  game = placeDie(game, 0, { nextRoll: 2 });
  game = placeDie(game, 1, { nextRoll: 5 });
  game = placeDie(game, 0, { nextRoll: 5 });
  return game;
}

describe('place', () => {
  it('places the die, records the event and hands over', () => {
    const reduce = makeLocalReducer(rng);
    const start = createGame({ id: 'abcd', firstRoll: 3 });
    const next = reduce(local(start), { type: 'place', column: 1 });
    expect(next.game.boards[0][1]).toEqual([3, null, null]);
    expect(next.game.current).toBe(1);
    expect(next.game.roll).toBe(4);
    expect(next.event).toEqual({
      serial: 1,
      placed: { player: 0, column: 1, slot: 0, die: 3 },
      removed: null,
    });
  });

  it('describes an attack with the slots that were cleared', () => {
    const reduce = makeLocalReducer(rng);
    const before = attackSetup();
    const next = reduce(
      {
        ...local(before),
        event: { serial: 3, placed: { player: 0, column: 0, slot: 1, die: 5 }, removed: null },
      },
      { type: 'place', column: 0 },
    );
    expect(next.game.boards[0][0]).toEqual([null, null, null]);
    expect(next.event).toEqual({
      serial: 4,
      placed: { player: 1, column: 0, slot: 0, die: 5 },
      removed: { player: 0, column: 0, die: 5, slots: [0, 1] },
    });
  });

  it('ignores a full column, a finished game and taps during the CPU turn', () => {
    const reduce = makeLocalReducer(rng);
    const full = {
      ...createGame({ id: 'abcd', firstRoll: 1 }),
      boards: [boardOf(columnOf(1, 2, 3)), boardOf()] as const,
    };
    const state = local(full);
    expect(reduce(state, { type: 'place', column: 0 })).toBe(state);

    const finished = local({
      ...createGame({ id: 'abcd', firstRoll: 1 }),
      status: 'finished',
      winner: 0,
      roll: null,
    });
    expect(reduce(finished, { type: 'place', column: 1 })).toBe(finished);

    const cpuTurn = local(
      placeDie(createGame({ id: 'abcd', firstRoll: 1 }), 0, { nextRoll: 2 }),
      'cpu',
    );
    expect(cpuTurn.game.current).toBe(1);
    expect(reduce(cpuTurn, { type: 'place', column: 1 })).toBe(cpuTurn);
  });
});

describe('cpu-move', () => {
  it('moves for the CPU in cpu mode on its turn', () => {
    const reduce = makeLocalReducer(rng);
    const state = local(
      placeDie(createGame({ id: 'abcd', firstRoll: 1 }), 0, { nextRoll: 6 }),
      'cpu',
    );
    const next = reduce(state, { type: 'cpu-move' });
    expect(next.game.history).toHaveLength(2);
    expect(next.game.current).toBe(0);
    expect(next.event?.placed.player).toBe(1);
  });

  it('does nothing in pass mode, on the human turn or after the game', () => {
    const reduce = makeLocalReducer(rng);
    const passState = local(
      placeDie(createGame({ id: 'abcd', firstRoll: 1 }), 0, { nextRoll: 6 }),
      'pass',
    );
    expect(reduce(passState, { type: 'cpu-move' })).toBe(passState);
    const humanTurn = local(createGame({ id: 'abcd', firstRoll: 1 }), 'cpu');
    expect(reduce(humanTurn, { type: 'cpu-move' })).toBe(humanTurn);
    const finished = local({ ...passState.game, status: 'finished', winner: 1, roll: null }, 'cpu');
    expect(reduce(finished, { type: 'cpu-move' })).toBe(finished);
  });
});

describe('new-game', () => {
  it('starts over with the same mode and no event', () => {
    const reduce = makeLocalReducer(rng);
    const played = reduce(local(createGame({ id: 'abcd', firstRoll: 3 }), 'cpu', 'easy'), {
      type: 'place',
      column: 0,
    });
    const fresh = reduce(played, { type: 'new-game' });
    expect(fresh.game.history).toEqual([]);
    expect(fresh.game.id).not.toBe('abcd');
    expect(fresh.event).toBeNull();
    expect(fresh.mode).toBe('cpu');
    expect(fresh.difficulty).toBe('easy');
  });
});

describe('describeMove and eventFromLastMove', () => {
  it('returns null for a fresh game', () => {
    expect(eventFromLastMove(createGame({ id: 'abcd', firstRoll: 1 }))).toBeNull();
  });

  it('reconstructs the last move from history', () => {
    const before = attackSetup();
    const after = placeDie(before, 0, { nextRoll: 1 });
    expect(eventFromLastMove(after)).toEqual(describeMove(before, 0, 4));
    expect(eventFromLastMove(after)?.removed?.slots).toEqual([0, 1]);
  });
});
