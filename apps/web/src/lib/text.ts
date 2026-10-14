import { winnerOf } from '@knucklebones/engine';
import type { GameState, PlayerIndex } from '@knucklebones/engine';
import type { UiEvent } from '../state/gameReducer';

export type Names = readonly [string, string];

const COUNT_WORDS: Readonly<Record<number, string>> = { 2: 'two', 3: 'three' };

export function possessive(name: string): string {
  return name === 'You' ? 'your' : `${name}'s`;
}

/** "CPU cleared two 5s from your column 2." or null when the move removed nothing. */
export function describeAttack(event: UiEvent, names: Names): string | null {
  if (!event.removed) return null;
  const attacker = names[event.placed.player];
  const victim = names[event.removed.player];
  const count = event.removed.slots.length;
  const die = event.removed.die;
  const dice = count === 1 ? `a ${die}` : `${COUNT_WORDS[count] ?? count} ${die}s`;
  return `${attacker} cleared ${dice} from ${possessive(victim)} column ${event.removed.column + 1}.`;
}

/** The headline for a finished game, from the given seat or neutrally. */
export function resultLine(game: GameState, names: Names, perspective: PlayerIndex | null): string {
  const winner = game.winner ?? winnerOf(game.boards);
  if (winner === 'draw') return 'A draw.';
  if (perspective !== null) return winner === perspective ? 'You win!' : 'You lose.';
  return `${names[winner]} wins.`;
}
