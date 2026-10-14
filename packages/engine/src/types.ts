export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type Slot = DieValue | null;
/** Slot 0 is nearest its owner. Dice fill upward and collapse toward slot 0. */
export type Column = readonly [Slot, Slot, Slot];
export type Board = readonly [Column, Column, Column];
export type ColumnIndex = 0 | 1 | 2;
export type PlayerIndex = 0 | 1;
export type GameStatus = 'playing' | 'finished';
export type Difficulty = 'easy' | 'normal';
/** Uniform random number in [0, 1). */
export type Rng = () => number;

export interface Move {
  readonly player: PlayerIndex;
  readonly column: ColumnIndex;
  readonly die: DieValue;
}

export interface GameState {
  /** Four base36 characters. Identifies an async game across links. */
  readonly id: string;
  readonly boards: readonly [Board, Board];
  /** The player who must place `roll`. */
  readonly current: PlayerIndex;
  /** The die the current player must place. Null only once the game is finished. */
  readonly roll: DieValue | null;
  readonly status: GameStatus;
  readonly winner: PlayerIndex | 'draw' | null;
  /** Every move so far. The turn number is `history.length + 1`. */
  readonly history: readonly Move[];
  /** Display names. An empty string means not set yet. */
  readonly names: readonly [string, string];
}
