import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAnimatedNumber, usePrefersReducedMotion } from './motion';

describe('usePrefersReducedMotion', () => {
  it('reads the media query and follows changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | null = null;
    const media = {
      matches: true,
      addEventListener: vi.fn((_: string, cb: (event: MediaQueryListEvent) => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList);

    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
    act(() => listener?.({ matches: false } as MediaQueryListEvent));
    expect(result.current).toBe(false);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalled();
  });

  it('defaults to motion when matchMedia is missing', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});

describe('useAnimatedNumber', () => {
  it('jumps straight to the target when instant', () => {
    const { result, rerender } = renderHook(({ v }) => useAnimatedNumber(v, true), {
      initialProps: { v: 5 },
    });
    expect(result.current).toBe(5);
    rerender({ v: 12 });
    expect(result.current).toBe(12);
  });

  it('tweens through animation frames otherwise', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(performance, 'now').mockReturnValue(1000);

    const { result, rerender } = renderHook(({ v }) => useAnimatedNumber(v, false, 400), {
      initialProps: { v: 0 },
    });
    expect(result.current).toBe(0);
    expect(frames).toHaveLength(0);

    rerender({ v: 100 });
    expect(frames).toHaveLength(1);
    act(() => frames[0]?.(1200));
    expect(result.current).toBe(75);
    expect(frames).toHaveLength(2);
    act(() => frames[1]?.(1400));
    expect(result.current).toBe(100);
    expect(frames).toHaveLength(2);
  });
});
