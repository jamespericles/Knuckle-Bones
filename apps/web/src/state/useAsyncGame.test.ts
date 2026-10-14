import { createGame, decodeGame, encodeGame, placeDie } from '@knucklebones/engine';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gameHref } from '../router/routes';
import { storage } from './storage';
import { createLinkGame, useAsyncGame } from './useAsyncGame';

// A constant rng rolls a 4 every time.
const rng = () => 0.5;
const FINISHED = '1abcdADBECFGJHKILMPNQO0';

function mount(code: string) {
  window.history.replaceState(null, '', `/${gameHref(code)}`);
  return renderHook(({ current }: { current: string }) => useAsyncGame(current, rng), {
    initialProps: { current: code },
  });
}

describe('useAsyncGame', () => {
  it('reports a broken code', () => {
    const { result } = mount('nope');
    expect(result.current.view).toEqual({ kind: 'broken', reason: 'bad-version' });
    expect(result.current.lastEvent).toBeNull();
  });

  it('seats a fresh device as the player to move and remembers the game', () => {
    const code = encodeGame(createGame({ id: 'abcd', firstRoll: 2 }));
    const { result } = mount(code);
    expect(result.current.view).toMatchObject({ kind: 'my-turn', myIndex: 0, needsName: true });
    expect(storage.getAsync('abcd')).toMatchObject({
      myIndex: 0,
      lastSeenTurn: 1,
      latestCode: code,
    });
  });

  it('places with the name, replaces the hash and waits for the friend', () => {
    const code = encodeGame(createGame({ id: 'abcd', firstRoll: 2 }));
    const { result, rerender } = mount(code);

    act(() => result.current.place(1, ' Ann '));
    const nextCode = window.location.hash.slice(gameHref('').length);
    expect(nextCode).not.toBe(code);
    const next = decodeGame(nextCode);
    expect(next.names).toEqual(['Ann', '']);
    expect(next.boards[0][1]).toEqual([2, null, null]);
    expect(next.current).toBe(1);
    expect(storage.getName()).toBe('Ann');

    rerender({ current: nextCode });
    expect(result.current.view).toMatchObject({ kind: 'waiting', myIndex: 0 });
    expect(result.current.justSent).toBe(true);
    expect(result.current.lastEvent?.placed).toEqual({ player: 0, column: 1, slot: 0, die: 2 });

    // Not my turn any more, so another tap does nothing.
    act(() => result.current.place(0, 'Ann'));
    expect(window.location.hash).toBe(gameHref(nextCode));
  });

  it('seats the friend as player 1 when they open the link on their own device', () => {
    const code = encodeGame(placeDie(createGame({ id: 'abcd', firstRoll: 2 }), 1, { nextRoll: 6 }));
    const { result } = mount(code);
    expect(result.current.view).toMatchObject({ kind: 'my-turn', myIndex: 1, needsName: true });
    expect(result.current.justSent).toBe(false);
  });

  it('flags a link older than the latest one known and can jump to the latest', () => {
    storage.setAsync('abcd', {
      myIndex: 0,
      lastSeenTurn: 5,
      latestCode: '1abcdLATEST',
      updatedAt: 1,
    });
    const code = encodeGame(createGame({ id: 'abcd', firstRoll: 2 }));
    const { result } = mount(code);
    expect(result.current.view).toMatchObject({
      kind: 'stale',
      myIndex: 0,
      latestCode: '1abcdLATEST',
      latestTurn: 5,
    });
    act(() => result.current.openLatest());
    expect(window.location.hash).toBe(gameHref('1abcdLATEST'));
    // The stored record is left alone by an old link.
    expect(storage.getAsync('abcd')?.lastSeenTurn).toBe(5);
  });

  it('shows a finished game as finished', () => {
    const { result } = mount(FINISHED);
    expect(result.current.view).toMatchObject({ kind: 'finished', myIndex: 0 });
    act(() => result.current.takeSeat());
    expect(result.current.view.kind).toBe('finished');
  });

  it('lets one device take the other seat', () => {
    storage.setAsync('abcd', { myIndex: 0, lastSeenTurn: 2, latestCode: 'x', updatedAt: 1 });
    const code = encodeGame(placeDie(createGame({ id: 'abcd', firstRoll: 2 }), 1, { nextRoll: 6 }));
    const { result } = mount(code);
    expect(result.current.view.kind).toBe('waiting');
    act(() => result.current.takeSeat());
    expect(result.current.view).toMatchObject({ kind: 'my-turn', myIndex: 1 });
    expect(storage.getAsync('abcd')?.myIndex).toBe(1);
  });

  it('openLatest does nothing without a record', () => {
    const { result } = mount('nope');
    const before = window.location.hash;
    act(() => result.current.openLatest());
    expect(window.location.hash).toBe(before);
  });
});

describe('createLinkGame', () => {
  it('creates a game as player 0 and remembers it', () => {
    const code = createLinkGame(' Bo ', rng);
    const game = decodeGame(code);
    expect(game.names).toEqual(['Bo', '']);
    expect(game.roll).toBe(4);
    expect(storage.getAsync(game.id)).toMatchObject({
      myIndex: 0,
      lastSeenTurn: 1,
      latestCode: code,
    });
    expect(storage.getName()).toBe('Bo');
  });

  it('works without a name', () => {
    const code = createLinkGame('', rng);
    expect(decodeGame(code).names).toEqual(['', '']);
    expect(storage.getName()).toBe('');
  });
});
