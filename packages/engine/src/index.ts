export type * from './types';
export { EngineError, CodecError } from './errors';
export type { EngineErrorCode, CodecErrorReason } from './errors';
export { mulberry32, defaultRng, rollDie, randomId, ID_ALPHABET, ID_LENGTH } from './rng';
export {
  ALL_COLUMNS,
  EMPTY_COLUMN,
  EMPTY_BOARD,
  columnOf,
  boardOf,
  diceIn,
  countOf,
  scoreColumn,
  scoreBoard,
  scores,
  isColumnFull,
  isBoardFull,
  legalColumns,
  addDie,
  removeValue,
} from './board';
export type { RemoveResult } from './board';
export {
  createGame,
  opponentOf,
  isColumnIndex,
  winnerOf,
  applyMove,
  placeDie,
  lastMove,
  turnNumber,
  replayHistory,
} from './game';
export type { CreateGameOptions, ApplyMoveOptions, ApplyMoveResult } from './game';
export { CPU_WEIGHTS, evaluateColumn, chooseCpuMove } from './cpu';
export {
  CODEC_VERSION,
  GAME_LINK_PREFIX,
  MAX_NAME_LENGTH,
  MAX_MOVES,
  encodeGame,
  decodeGame,
  tryDecodeGame,
  buildGameLink,
  extractGameCode,
} from './codec';
export type { DecodeResult } from './codec';
