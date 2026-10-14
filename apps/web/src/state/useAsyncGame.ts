import {
  MAX_NAME_LENGTH,
  applyMove,
  createGame,
  defaultRng,
  encodeGame,
  tryDecodeGame,
  turnNumber,
} from '@knucklebones/engine';
import type {
  CodecErrorReason,
  ColumnIndex,
  GameState,
  PlayerIndex,
  Rng,
} from '@knucklebones/engine';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { gameHref } from '../router/routes';
import { navigate } from '../router/useHashRoute';
import { eventFromLastMove } from './gameReducer';
import type { UiEvent } from './gameReducer';
import { parseAsyncRecord, storage } from './storage';
import type { AsyncRecord } from './storage';

export type AsyncView =
  | { readonly kind: 'broken'; readonly reason: CodecErrorReason }
  | { readonly kind: 'finished'; readonly game: GameState; readonly myIndex: PlayerIndex }
  | {
      readonly kind: 'stale';
      readonly game: GameState;
      readonly myIndex: PlayerIndex;
      readonly latestCode: string;
      readonly latestTurn: number;
    }
  | { readonly kind: 'waiting'; readonly game: GameState; readonly myIndex: PlayerIndex }
  | {
      readonly kind: 'my-turn';
      readonly game: GameState;
      readonly myIndex: PlayerIndex;
      readonly needsName: boolean;
    };

export interface AsyncGameApi {
  readonly view: AsyncView;
  /** The move that produced the current state, for highlighting what just happened. */
  readonly lastEvent: UiEvent | null;
  /** True when this device produced the current link with its own move. */
  readonly justSent: boolean;
  readonly place: (column: ColumnIndex, name: string) => void;
  /** Claim the seat of whoever is to move. Lets one device play both sides. */
  readonly takeSeat: () => void;
  readonly openLatest: () => void;
}

function cleanName(name: string): string {
  return name.trim().slice(0, MAX_NAME_LENGTH);
}

function withName(game: GameState, index: PlayerIndex, name: string): GameState {
  const clean = cleanName(name);
  if (clean === '') return game;
  const names: [string, string] = index === 0 ? [clean, game.names[1]] : [game.names[0], clean];
  return { ...game, names };
}

/** Starts a link game as player 0 and returns its share code. */
export function createLinkGame(name: string, rng: Rng = defaultRng): string {
  const game = createGame({ rng, names: [cleanName(name), ''] });
  const code = encodeGame(game);
  storage.setAsync(game.id, {
    myIndex: 0,
    lastSeenTurn: turnNumber(game),
    latestCode: code,
    updatedAt: Date.now(),
  });
  if (cleanName(name) !== '') storage.setName(name);
  return code;
}

function viewFor(
  decoded: ReturnType<typeof tryDecodeGame>,
  record: AsyncRecord | null,
  myIndex: PlayerIndex,
  turn: number,
): AsyncView {
  if (!decoded.ok) return { kind: 'broken', reason: decoded.reason };
  const game = decoded.state;
  if (game.status === 'finished') return { kind: 'finished', game, myIndex };
  if (record && turn < record.lastSeenTurn) {
    return {
      kind: 'stale',
      game,
      myIndex,
      latestCode: record.latestCode,
      latestTurn: record.lastSeenTurn,
    };
  }
  if (game.current !== myIndex) return { kind: 'waiting', game, myIndex };
  return { kind: 'my-turn', game, myIndex, needsName: game.names[myIndex] === '' };
}

const noSnapshot = (): null => null;

export function useAsyncGame(code: string, rng: Rng = defaultRng): AsyncGameApi {
  const decoded = useMemo(() => tryDecodeGame(code), [code]);
  const game = decoded.ok ? decoded.state : null;
  const gameId = game?.id ?? null;
  const [sentCode, setSentCode] = useState<string | null>(null);

  // What this device already knows about the game. Storage writes re-render us.
  const raw = useSyncExternalStore(
    storage.subscribe,
    () => (gameId === null ? null : storage.asyncSnapshot(gameId)),
    noSnapshot,
  );
  const stored = useMemo(() => parseAsyncRecord(raw), [raw]);

  const turn = game ? turnNumber(game) : 0;
  const isNewer = game !== null && (stored === null || turn > stored.lastSeenTurn);
  const record = useMemo<AsyncRecord | null>(() => {
    if (!game) return null;
    if (!isNewer) return stored;
    return {
      // A fresh device opening a link is the player whose turn it is.
      myIndex: stored?.myIndex ?? game.current,
      lastSeenTurn: turn,
      latestCode: code,
      updatedAt: 0,
    };
  }, [game, stored, isNewer, turn, code]);
  const myIndex: PlayerIndex = record?.myIndex ?? 0;

  // Remember every newer link we open.
  useEffect(() => {
    if (game && isNewer && record) {
      storage.setAsync(game.id, { ...record, updatedAt: Date.now() });
    }
  }, [game, isNewer, record]);

  const view = viewFor(decoded, record, myIndex, turn);
  const lastEvent = useMemo(() => (game ? eventFromLastMove(game) : null), [game]);

  const place = useCallback(
    (column: ColumnIndex, name: string) => {
      if (!game || game.status !== 'playing' || game.current !== myIndex) return;
      const next = applyMove(withName(game, myIndex, name), column, { rng }).state;
      const nextCode = encodeGame(next);
      storage.setAsync(game.id, {
        myIndex,
        lastSeenTurn: turnNumber(next),
        latestCode: nextCode,
        updatedAt: Date.now(),
      });
      if (cleanName(name) !== '') storage.setName(name);
      setSentCode(nextCode);
      navigate(gameHref(nextCode), { replace: true });
    },
    [game, myIndex, rng],
  );

  const takeSeat = useCallback(() => {
    if (!game || game.status !== 'playing' || !record) return;
    storage.setAsync(game.id, { ...record, myIndex: game.current, updatedAt: Date.now() });
  }, [game, record]);

  const openLatest = useCallback(() => {
    if (record) navigate(gameHref(record.latestCode));
  }, [record]);

  return { view, lastEvent, justSent: sentCode === code, place, takeSeat, openLatest };
}
