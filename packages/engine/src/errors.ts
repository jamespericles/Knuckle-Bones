export type EngineErrorCode = 'COLUMN_FULL' | 'GAME_OVER' | 'INVALID_COLUMN' | 'NO_ROLL';

export class EngineError extends Error {
  readonly code: EngineErrorCode;

  constructor(code: EngineErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'EngineError';
    this.code = code;
  }
}

export type CodecErrorReason =
  | 'empty'
  | 'bad-version'
  | 'bad-id'
  | 'bad-move-char'
  | 'too-many-moves'
  | 'bad-roll'
  | 'illegal-move'
  | 'move-after-finish'
  | 'bad-name';

export class CodecError extends Error {
  readonly reason: CodecErrorReason;

  constructor(reason: CodecErrorReason, message?: string) {
    super(message ?? `Invalid game code (${reason})`);
    this.name = 'CodecError';
    this.reason = reason;
  }
}
