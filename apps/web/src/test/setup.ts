import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Reduced motion on: animations are instant and the CPU moves without delay.
function matchMedia(query: string): MediaQueryList {
  return {
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
