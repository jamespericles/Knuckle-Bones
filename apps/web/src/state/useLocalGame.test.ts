import { createGame, encodeGame, placeDie } from '@knucklebones/engine';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { storage } from './storage';
import { useLocalGame } from './useLocalGame';

// A constant rng rolls a 4 every time.
const rng = () => 0.5;

describe('useLocalGame', () => {
  it('starts a new game and saves after the first move', () => {
    const { result } = renderHook(() => useLocalGame('pass', 'normal', { rng }));
    expect(result.current.state.game.history).toHaveLength(0);
    expect(result.current.humanTurn).toBe(true);
    expect(storage.getLocal()).toBeNull();

    act(() => result.current.place(0));
    expect(result.current.state.game.history).toHaveLength(1);
    expect(result.current.state.event?.placed).toEqual({ player: 0, column: 0, slot: 0, die: 4 });
    expect(storage.getLocal()?.mode).toBe('pass');
    expect(result.current.humanTurn).toBe(true);
  });

  it('resumes a saved game of the same mode and difficulty', async () => {
    const saved = placeDie(createGame({ id: 'abcd', firstRoll: 2 }), 1, { nextRoll: 3 });
    storage.setLocal({ code: encodeGame(saved), mode: 'cpu', difficulty: 'normal' });

    const other = renderHook(() => useLocalGame('cpu', 'easy', { rng }));
    expect(other.result.current.state.game.id).not.toBe('abcd');
    other.unmount();

    const { result } = renderHook(() => useLocalGame('cpu', 'normal', { rng, cpuDelayMs: 0 }));
    expect(result.current.state.game.id).toBe('abcd');
    expect(result.current.humanTurn).toBe(false);
    await waitFor(() => expect(result.current.state.game.history).toHaveLength(2));
    expect(result.current.state.game.current).toBe(0);
    expect(result.current.humanTurn).toBe(true);
  });

  it('does not resume a finished or unreadable save', () => {
    storage.setLocal({ code: '1abcdADBECFGJHKILMPNQO0', mode: 'pass', difficulty: 'normal' });
    const finished = renderHook(() => useLocalGame('pass', 'normal', { rng }));
    expect(finished.result.current.state.game.history).toHaveLength(0);
    finished.unmount();

    storage.setLocal({ code: 'garbage', mode: 'pass', difficulty: 'normal' });
    const broken = renderHook(() => useLocalGame('pass', 'normal', { rng }));
    expect(broken.result.current.state.game.history).toHaveLength(0);
  });

  it('lets the CPU answer and ignores taps during its turn', async () => {
    const { result } = renderHook(() => useLocalGame('cpu', 'normal', { rng, cpuDelayMs: 0 }));
    act(() => result.current.place(0));
    expect(result.current.humanTurn).toBe(false);
    act(() => result.current.place(1));
    expect(result.current.state.game.history).toHaveLength(1);

    await waitFor(() => expect(result.current.state.game.history).toHaveLength(2));
    expect(result.current.state.game.current).toBe(0);
    expect(result.current.state.event?.placed.player).toBe(1);
  });

  it('newGame clears the save and resets the board', () => {
    const { result } = renderHook(() => useLocalGame('pass', 'normal', { rng }));
    act(() => result.current.place(2));
    expect(storage.getLocal()).not.toBeNull();
    act(() => result.current.newGame());
    expect(result.current.state.game.history).toHaveLength(0);
    expect(result.current.state.event).toBeNull();
    expect(storage.getLocal()).toBeNull();
  });
});
