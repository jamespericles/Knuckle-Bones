import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { absoluteGameUrl, cpuHref, gameHref, homeHref, passHref } from './routes';
import { navigate, parseHash, useHashRoute } from './useHashRoute';

describe('parseHash', () => {
  it.each([
    ['', { kind: 'home' }],
    ['#', { kind: 'home' }],
    ['#/', { kind: 'home' }],
    ['#/play/pass', { kind: 'local', mode: 'pass' }],
    ['#/play/cpu/easy', { kind: 'local', mode: 'cpu', difficulty: 'easy' }],
    ['#/play/cpu/normal', { kind: 'local', mode: 'cpu', difficulty: 'normal' }],
    ['#/g/1abcd5', { kind: 'game', code: '1abcd5' }],
    ['#/g/', { kind: 'not-found', hash: '#/g/' }],
    ['#/play/cpu/hard', { kind: 'not-found', hash: '#/play/cpu/hard' }],
    ['#/nope', { kind: 'not-found', hash: '#/nope' }],
  ])('%s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });
});

describe('route builders', () => {
  it('build hash routes', () => {
    expect(homeHref()).toBe('#/');
    expect(passHref()).toBe('#/play/pass');
    expect(cpuHref('easy')).toBe('#/play/cpu/easy');
    expect(gameHref('1abcd5')).toBe('#/g/1abcd5');
  });

  it('builds an absolute link from the current page', () => {
    window.history.replaceState(null, '', '/app/?x=1#/play/pass');
    expect(absoluteGameUrl('1abcd5')).toBe('http://localhost:3000/app/?x=1#/g/1abcd5');
  });
});

describe('useHashRoute and navigate', () => {
  it('follows pushed and replaced hashes', async () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ kind: 'home' });

    act(() => navigate(passHref(), { replace: true }));
    expect(result.current).toEqual({ kind: 'local', mode: 'pass' });
    expect(window.location.hash).toBe('#/play/pass');

    await act(async () => {
      navigate(cpuHref('easy'));
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current).toEqual({ kind: 'local', mode: 'cpu', difficulty: 'easy' });
  });
});
