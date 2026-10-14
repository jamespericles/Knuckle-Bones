import { useEffect, useRef, useState } from 'react';

export const DURATIONS = {
  drop: 350,
  shatter: 450,
  count: 400,
  cpuThink: 900,
} as const;

const QUERY = '(prefers-reduced-motion: reduce)';

function readReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Tweens from the previously shown number to `target` over `duration` ms using
 * requestAnimationFrame. Jumps straight to the target when `instant` is set.
 */
export function useAnimatedNumber(
  target: number,
  instant: boolean,
  duration = DURATIONS.count,
): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (instant || from === target || duration <= 0) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const value = Math.round(from + (target - from) * eased);
      shownRef.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, instant, duration]);

  return instant ? target : shown;
}
