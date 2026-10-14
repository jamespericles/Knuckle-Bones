import { CodecError, EngineError } from './errors';
import { createGame, placeDie } from './game';
import { ID_LENGTH } from './rng';
import type { ColumnIndex, DieValue, GameState, Move, PlayerIndex } from './types';

/**
 * Share-code format. The same string is the payload of a web link and, later, of
 * an iMessage bubble.
 *
 *   code  := V ID MOVES ROLL [ "," NAME0 "," NAME1 ]
 *   V     := "1"                       format version
 *   ID    := 4 chars [0-9a-z]
 *   MOVES := 0..MAX_MOVES chars "A".."R", one per move in order;
 *            char = 'A' + column * 6 + (die - 1); the player alternates from 0
 *   ROLL  := "1".."6" the pending die, or "0" exactly when the game is finished
 *   NAMES := optional; each is encodeURIComponent(name.slice(0, 16))
 *
 * Decoding replays the moves through the engine, so any impossible state fails.
 */
export const CODEC_VERSION = '1';
export const GAME_LINK_PREFIX = '#/g/';
export const MAX_NAME_LENGTH = 16;
/** Attacks remove dice, so games can run long. Anything past this is garbage. */
export const MAX_MOVES = 300;

const ID_RE = /^[0-9a-z]{4}$/;
const MOVE_BASE = 'A'.charCodeAt(0);
const MOVE_COUNT = 18;

function moveToChar(move: Move): string {
  return String.fromCharCode(MOVE_BASE + move.column * 6 + (move.die - 1));
}

function charToMove(ch: string, player: PlayerIndex): Move {
  const code = ch.charCodeAt(0) - MOVE_BASE;
  if (ch.length !== 1 || Number.isNaN(code) || code < 0 || code >= MOVE_COUNT) {
    throw new CodecError('bad-move-char');
  }
  return {
    player,
    column: Math.floor(code / 6) as ColumnIndex,
    die: ((code % 6) + 1) as DieValue,
  };
}

function encodeName(name: string): string {
  return encodeURIComponent(name.slice(0, MAX_NAME_LENGTH));
}

function decodeName(part: string): string {
  try {
    return decodeURIComponent(part).slice(0, MAX_NAME_LENGTH);
  } catch {
    throw new CodecError('bad-name');
  }
}

export function encodeGame(state: GameState): string {
  const moves = state.history.map(moveToChar).join('');
  let code = `${CODEC_VERSION}${state.id}${moves}${state.roll ?? 0}`;
  const [a, b] = state.names;
  if (a !== '' || b !== '') code += `,${encodeName(a)},${encodeName(b)}`;
  return code;
}

export function decodeGame(code: string): GameState {
  if (typeof code !== 'string' || code.length === 0) throw new CodecError('empty');

  const comma = code.indexOf(',');
  const head = comma === -1 ? code : code.slice(0, comma);
  const tail = comma === -1 ? null : code.slice(comma + 1);

  if (head.charAt(0) !== CODEC_VERSION) throw new CodecError('bad-version');
  const id = head.slice(1, 1 + ID_LENGTH);
  if (!ID_RE.test(id)) throw new CodecError('bad-id');

  const rest = head.slice(1 + ID_LENGTH);
  if (rest.length === 0) throw new CodecError('bad-roll');
  const rollChar = rest.charAt(rest.length - 1);
  if (!/^[0-6]$/.test(rollChar)) throw new CodecError('bad-roll');
  const roll = rollChar === '0' ? null : (Number(rollChar) as DieValue);

  const moveChars = rest.slice(0, -1);
  if (moveChars.length > MAX_MOVES) throw new CodecError('too-many-moves');
  const moves = [...moveChars].map((ch, i) => charToMove(ch, (i % 2) as PlayerIndex));

  let names: [string, string] = ['', ''];
  if (tail !== null) {
    const parts = tail.split(',');
    if (parts.length !== 2) throw new CodecError('bad-name');
    names = [decodeName(parts[0] ?? ''), decodeName(parts[1] ?? '')];
  }

  const firstRoll = moves[0]?.die ?? roll;
  if (firstRoll === null) throw new CodecError('bad-roll');

  let state = createGame({ id, names, firstRoll });
  for (let i = 0; i < moves.length; i += 1) {
    const move = moves[i] as Move;
    if (state.status === 'finished') throw new CodecError('move-after-finish');
    const nextRoll = moves[i + 1]?.die ?? roll ?? 1;
    try {
      state = placeDie(state, move.column, { nextRoll });
    } catch (error) {
      if (error instanceof EngineError) throw new CodecError('illegal-move');
      throw error;
    }
  }

  if (state.status === 'finished' && roll !== null) throw new CodecError('bad-roll');
  if (state.status === 'playing' && roll === null) throw new CodecError('bad-roll');
  return state;
}

export type DecodeResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: CodecError['reason'] };

export function tryDecodeGame(code: string): DecodeResult {
  try {
    return { ok: true, state: decodeGame(code) };
  } catch (error) {
    if (error instanceof CodecError) return { ok: false, reason: error.reason };
    throw error;
  }
}

/** `baseUrl` is the page URL without a hash, e.g. `https://host/path/`. */
export function buildGameLink(baseUrl: string, state: GameState): string {
  const hashAt = baseUrl.indexOf('#');
  const base = hashAt === -1 ? baseUrl : baseUrl.slice(0, hashAt);
  return `${base}${GAME_LINK_PREFIX}${encodeGame(state)}`;
}

/** Pulls the share code out of a full link or a bare hash. Null when absent. */
export function extractGameCode(linkOrHash: string): string | null {
  const at = linkOrHash.indexOf(GAME_LINK_PREFIX);
  if (at === -1) return null;
  const code = linkOrHash.slice(at + GAME_LINK_PREFIX.length);
  return code.length > 0 ? code : null;
}
