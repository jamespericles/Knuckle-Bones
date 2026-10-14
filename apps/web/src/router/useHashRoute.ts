import { useMemo, useSyncExternalStore } from 'react';
import type { Difficulty } from '@knucklebones/engine';

export type Route =
  | { readonly kind: 'home' }
  | { readonly kind: 'local'; readonly mode: 'pass' }
  | { readonly kind: 'local'; readonly mode: 'cpu'; readonly difficulty: Difficulty }
  | { readonly kind: 'game'; readonly code: string }
  | { readonly kind: 'not-found'; readonly hash: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '');
  if (path === '' || path === '/') return { kind: 'home' };
  if (path === '/play/pass') return { kind: 'local', mode: 'pass' };
  const cpu = /^\/play\/cpu\/(easy|normal)$/.exec(path);
  if (cpu) return { kind: 'local', mode: 'cpu', difficulty: cpu[1] as Difficulty };
  if (path.startsWith('/g/') && path.length > 3) return { kind: 'game', code: path.slice(3) };
  return { kind: 'not-found', hash };
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getSnapshot(): string {
  return window.location.hash;
}

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  return useMemo(() => parseHash(hash), [hash]);
}

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  readonly replace?: boolean | undefined;
}

export function navigate(to: string, opts: NavigateOptions = {}): void {
  if (opts.replace) {
    window.history.replaceState(null, '', to);
    // replaceState does not fire hashchange, so notify subscribers ourselves.
    window.dispatchEvent(new Event('hashchange'));
  } else {
    window.location.hash = to;
  }
}
