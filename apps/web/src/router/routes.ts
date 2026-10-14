import { GAME_LINK_PREFIX } from '@knucklebones/engine';
import type { Difficulty } from '@knucklebones/engine';

export const homeHref = (): string => '#/';
export const passHref = (): string => '#/play/pass';
export const cpuHref = (difficulty: Difficulty): string => `#/play/cpu/${difficulty}`;
export const gameHref = (code: string): string => `${GAME_LINK_PREFIX}${code}`;

/** Full URL for a share code, built from wherever the app is currently hosted. */
export function absoluteGameUrl(code: string): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${gameHref(code)}`;
}
