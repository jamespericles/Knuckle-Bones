import type { Difficulty, PlayerIndex } from '@knucklebones/engine';

export type LocalMode = 'cpu' | 'pass';

export interface LocalSave {
  readonly code: string;
  readonly mode: LocalMode;
  readonly difficulty: Difficulty;
}

export interface AsyncRecord {
  readonly myIndex: PlayerIndex;
  /** Turn number of the newest link we have seen or produced for this game. */
  readonly lastSeenTurn: number;
  readonly latestCode: string;
  readonly updatedAt: number;
}

export interface AsyncEntry {
  readonly id: string;
  readonly record: AsyncRecord;
}

const KEY_NAME = 'kb:name';
const KEY_LOCAL = 'kb:local';
const KEY_ASYNC_INDEX = 'kb:async-index';
const asyncKey = (id: string): string => `kb:async:${id}`;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, quota). The game still works.
  }
  notify();
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLocalSave(value: unknown): value is LocalSave {
  return (
    isRecord(value) &&
    typeof value['code'] === 'string' &&
    (value['mode'] === 'cpu' || value['mode'] === 'pass') &&
    (value['difficulty'] === 'easy' || value['difficulty'] === 'normal')
  );
}

function isAsyncRecord(value: unknown): value is AsyncRecord {
  return (
    isRecord(value) &&
    (value['myIndex'] === 0 || value['myIndex'] === 1) &&
    typeof value['lastSeenTurn'] === 'number' &&
    typeof value['latestCode'] === 'string' &&
    typeof value['updatedAt'] === 'number'
  );
}

/** Turns a raw stored string into a record, or null when missing or malformed. */
export function parseAsyncRecord(raw: string | null): AsyncRecord | null {
  const value = parseJson(raw);
  return isAsyncRecord(value) ? value : null;
}

function readIndex(): string[] {
  const value = parseJson(read(KEY_ASYNC_INDEX));
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export const storage = {
  /** Notifies on every write from this tab and on changes from other tabs. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', listener);
    };
  },

  getName(): string {
    return read(KEY_NAME) ?? '';
  },
  setName(name: string): void {
    write(KEY_NAME, name.trim() === '' ? null : name.trim());
  },

  getLocal(): LocalSave | null {
    const value = parseJson(read(KEY_LOCAL));
    return isLocalSave(value) ? value : null;
  },
  setLocal(save: LocalSave): void {
    write(KEY_LOCAL, JSON.stringify(save));
  },
  clearLocal(): void {
    write(KEY_LOCAL, null);
  },

  /** The raw stored string for a game, a stable snapshot for useSyncExternalStore. */
  asyncSnapshot(id: string): string | null {
    return read(asyncKey(id));
  },
  getAsync(id: string): AsyncRecord | null {
    return parseAsyncRecord(read(asyncKey(id)));
  },
  setAsync(id: string, record: AsyncRecord): void {
    const index = readIndex();
    if (!index.includes(id)) write(KEY_ASYNC_INDEX, JSON.stringify([...index, id]));
    write(asyncKey(id), JSON.stringify(record));
  },
  removeAsync(id: string): void {
    write(KEY_ASYNC_INDEX, JSON.stringify(readIndex().filter(other => other !== id)));
    write(asyncKey(id), null);
  },
  /** Every known link game, newest first. */
  listAsync(): AsyncEntry[] {
    const entries: AsyncEntry[] = [];
    for (const id of readIndex()) {
      const record = storage.getAsync(id);
      if (record) entries.push({ id, record });
    }
    return entries.sort((a, b) => b.record.updatedAt - a.record.updatedAt);
  },
};
