import { addDie, countOf, isColumnFull, legalColumns, removeValue, scoreColumn } from './board';
import { EngineError } from './errors';
import { opponentOf } from './game';
import { defaultRng } from './rng';
import type { ColumnIndex, Difficulty, GameState, Rng } from './types';

export const CPU_WEIGHTS = {
  /** Fraction of a column's matched value we treat as at risk of being wiped. */
  exposure: 0.25,
  /** Random tie-break added to each column's value. */
  jitter: 0.01,
};

/**
 * Greedy value of placing the current roll in `column`: points gained, plus points
 * the attack removes from the opponent, minus a penalty for stacking matched dice
 * where the opponent can still hit them.
 */
export function evaluateColumn(state: GameState, column: ColumnIndex): number {
  const die = state.roll;
  if (die === null) throw new EngineError('NO_ROLL');
  const mine = state.boards[state.current][column];
  const theirs = state.boards[opponentOf(state.current)][column];

  const placed = addDie(mine, die);
  const ownGain = scoreColumn(placed) - scoreColumn(mine);
  const theirsAfter = removeValue(theirs, die).column;
  const oppLoss = scoreColumn(theirs) - scoreColumn(theirsAfter);
  const n = countOf(placed, die);
  const exposure = isColumnFull(theirsAfter) ? 0 : CPU_WEIGHTS.exposure * die * n * n;
  return ownGain + oppLoss - exposure;
}

export function chooseCpuMove(
  state: GameState,
  difficulty: Difficulty = 'normal',
  rng: Rng = defaultRng,
): ColumnIndex {
  if (state.status === 'finished') throw new EngineError('GAME_OVER');
  const legal = legalColumns(state.boards[state.current]);
  const first = legal[0];
  if (first === undefined) throw new EngineError('COLUMN_FULL', 'No legal column');
  if (legal.length === 1) return first;

  if (difficulty === 'easy') {
    return legal[Math.floor(rng() * legal.length)] ?? first;
  }

  let best = first;
  let bestValue = -Infinity;
  for (const column of legal) {
    const value = evaluateColumn(state, column) + rng() * CPU_WEIGHTS.jitter;
    if (value > bestValue) {
      bestValue = value;
      best = column;
    }
  }
  return best;
}
