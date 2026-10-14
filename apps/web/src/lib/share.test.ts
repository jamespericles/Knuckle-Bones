import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyLink, shareLink } from './share';

function setNavigator(key: 'share' | 'clipboard', value: unknown): void {
  Object.defineProperty(navigator, key, { configurable: true, writable: true, value });
}

afterEach(() => {
  setNavigator('share', undefined);
  setNavigator('clipboard', undefined);
});

describe('shareLink', () => {
  it('uses the share sheet when present', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator('share', share);
    await expect(shareLink('https://x/#/g/1', 'Your move')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ text: 'Your move', url: 'https://x/#/g/1' });
  });

  it('reports a cancelled share without copying', async () => {
    const abort = new Error('cancel');
    abort.name = 'AbortError';
    setNavigator('share', vi.fn().mockRejectedValue(abort));
    const writeText = vi.fn();
    setNavigator('clipboard', { writeText });
    await expect(shareLink('u', 't')).resolves.toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to the clipboard when sharing fails for another reason', async () => {
    setNavigator('share', vi.fn().mockRejectedValue(new Error('nope')));
    setNavigator('clipboard', { writeText: vi.fn().mockResolvedValue(undefined) });
    await expect(shareLink('u', 't')).resolves.toBe('copied');
  });

  it('copies when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator('clipboard', { writeText });
    await expect(shareLink('u', 't')).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('u');
  });

  it('asks for manual copying when nothing is available', async () => {
    await expect(shareLink('u', 't')).resolves.toBe('manual');
  });
});

describe('copyLink', () => {
  it('reports manual when the clipboard rejects', async () => {
    setNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    await expect(copyLink('u')).resolves.toBe('manual');
  });

  it('reports manual when the clipboard has no writeText', async () => {
    setNavigator('clipboard', {});
    await expect(copyLink('u')).resolves.toBe('manual');
  });
});
