import { describe, expect, it, vi } from 'vitest';
import { parseAsyncRecord, storage } from './storage';
import type { AsyncRecord } from './storage';

const record = (updatedAt: number, myIndex: 0 | 1 = 0): AsyncRecord => ({
  myIndex,
  lastSeenTurn: 3,
  latestCode: '1abcdAB5',
  updatedAt,
});

describe('name', () => {
  it('trims and round-trips, clearing on blank', () => {
    expect(storage.getName()).toBe('');
    storage.setName('  Ann ');
    expect(storage.getName()).toBe('Ann');
    storage.setName('   ');
    expect(storage.getName()).toBe('');
  });
});

describe('local save', () => {
  it('round-trips and clears', () => {
    expect(storage.getLocal()).toBeNull();
    storage.setLocal({ code: '1abcd5', mode: 'cpu', difficulty: 'easy' });
    expect(storage.getLocal()).toEqual({ code: '1abcd5', mode: 'cpu', difficulty: 'easy' });
    storage.clearLocal();
    expect(storage.getLocal()).toBeNull();
  });

  it('ignores corrupt or malformed entries', () => {
    window.localStorage.setItem('kb:local', '{not json');
    expect(storage.getLocal()).toBeNull();
    window.localStorage.setItem('kb:local', JSON.stringify({ code: 1, mode: 'cpu' }));
    expect(storage.getLocal()).toBeNull();
    window.localStorage.setItem('kb:local', JSON.stringify(null));
    expect(storage.getLocal()).toBeNull();
  });
});

describe('async records', () => {
  it('stores records and lists them newest first', () => {
    storage.setAsync('aaaa', record(10));
    storage.setAsync('bbbb', record(30, 1));
    storage.setAsync('cccc', record(20));
    expect(storage.getAsync('bbbb')).toEqual(record(30, 1));
    expect(storage.listAsync().map(e => e.id)).toEqual(['bbbb', 'cccc', 'aaaa']);
  });

  it('does not duplicate index entries on update', () => {
    storage.setAsync('aaaa', record(10));
    storage.setAsync('aaaa', record(50));
    expect(storage.listAsync()).toHaveLength(1);
    expect(storage.getAsync('aaaa')?.updatedAt).toBe(50);
  });

  it('removes records and skips unreadable ones', () => {
    storage.setAsync('aaaa', record(10));
    storage.setAsync('bbbb', record(20));
    window.localStorage.setItem('kb:async:bbbb', '{"myIndex":2}');
    expect(storage.listAsync().map(e => e.id)).toEqual(['aaaa']);
    storage.removeAsync('aaaa');
    expect(storage.getAsync('aaaa')).toBeNull();
    expect(storage.listAsync()).toEqual([]);
  });

  it('tolerates a corrupt index', () => {
    window.localStorage.setItem('kb:async-index', '"nope"');
    expect(storage.listAsync()).toEqual([]);
    window.localStorage.setItem('kb:async-index', JSON.stringify([1, 'aaaa']));
    storage.setAsync('aaaa', record(1));
    expect(storage.listAsync().map(e => e.id)).toEqual(['aaaa']);
  });
});

describe('when localStorage throws', () => {
  it('reads as empty and writes silently', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(storage.getName()).toBe('');
    expect(() => storage.setName('Ann')).not.toThrow();
    expect(storage.listAsync()).toEqual([]);
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('subscribe', () => {
  it('notifies on writes from this tab and from other tabs until unsubscribed', () => {
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);
    storage.setName('Ann');
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('storage'));
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    storage.setName('Bo');
    window.dispatchEvent(new Event('storage'));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('exposes the raw snapshot used by the hook', () => {
    expect(storage.asyncSnapshot('zzzz')).toBeNull();
    storage.setAsync('zzzz', record(5));
    expect(storage.asyncSnapshot('zzzz')).toBe(JSON.stringify(record(5)));
    expect(parseAsyncRecord('{"nope":1}')).toBeNull();
  });
});
