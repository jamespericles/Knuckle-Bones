import { createGame, defaultRng, encodeGame, tryDecodeGame } from '@knucklebones/engine';
import type { ColumnIndex, Difficulty, Rng } from '@knucklebones/engine';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { DURATIONS, usePrefersReducedMotion } from '../lib/motion';
import { CPU_PLAYER, makeLocalReducer } from './gameReducer';
import type { LocalState } from './gameReducer';
import { storage } from './storage';
import type { LocalMode } from './storage';

export interface UseLocalGameOptions {
  readonly rng?: Rng | undefined;
  /** Delay before the CPU moves. Defaults to a short think, or 0 under reduced motion. */
  readonly cpuDelayMs?: number | undefined;
}

export interface LocalGameApi {
  readonly state: LocalState;
  readonly place: (column: ColumnIndex) => void;
  readonly newGame: () => void;
  /** True when a human should be tapping a column right now. */
  readonly humanTurn: boolean;
}

interface InitArgs {
  readonly mode: LocalMode;
  readonly difficulty: Difficulty;
  readonly rng: Rng;
}

/** Resume a saved game for this mode if it is still in progress, otherwise start fresh. */
export function initialLocalState({ mode, difficulty, rng }: InitArgs): LocalState {
  const saved = storage.getLocal();
  if (saved && saved.mode === mode && saved.difficulty === difficulty) {
    const decoded = tryDecodeGame(saved.code);
    if (decoded.ok && decoded.state.status === 'playing') {
      return { game: decoded.state, mode, difficulty, event: null };
    }
  }
  return { game: createGame({ rng }), mode, difficulty, event: null };
}

export function useLocalGame(
  mode: LocalMode,
  difficulty: Difficulty,
  opts: UseLocalGameOptions = {},
): LocalGameApi {
  const rng = opts.rng ?? defaultRng;
  const reducer = useMemo(() => makeLocalReducer(rng), [rng]);
  const [state, dispatch] = useReducer(reducer, { mode, difficulty, rng }, initialLocalState);
  const { game } = state;

  useEffect(() => {
    if (game.history.length === 0) return;
    storage.setLocal({ code: encodeGame(game), mode, difficulty });
  }, [game, mode, difficulty]);

  const reducedMotion = usePrefersReducedMotion();
  const cpuDelay = opts.cpuDelayMs ?? (reducedMotion ? 0 : DURATIONS.cpuThink);

  useEffect(() => {
    if (mode !== 'cpu' || game.current !== CPU_PLAYER || game.status !== 'playing') {
      return undefined;
    }
    const timer = window.setTimeout(() => dispatch({ type: 'cpu-move' }), cpuDelay);
    return () => window.clearTimeout(timer);
  }, [mode, game, cpuDelay]);

  const place = useCallback((column: ColumnIndex) => dispatch({ type: 'place', column }), []);
  const newGame = useCallback(() => {
    storage.clearLocal();
    dispatch({ type: 'new-game' });
  }, []);

  const humanTurn = game.status === 'playing' && (mode === 'pass' || game.current !== CPU_PLAYER);

  return { state, place, newGame, humanTurn };
}
