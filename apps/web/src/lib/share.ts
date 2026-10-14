export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'manual';

/** Copies a link to the clipboard, or reports that the user has to do it by hand. */
export async function copyLink(url: string): Promise<'copied' | 'manual'> {
  const { clipboard } = navigator;
  if (!clipboard || typeof clipboard.writeText !== 'function') return 'manual';
  try {
    await clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'manual';
  }
}

/**
 * Hands a link to the OS share sheet when available, otherwise copies it.
 * Call this synchronously from a click handler: iOS only opens the share sheet
 * inside a user gesture, and `navigator.share` is the first thing invoked here.
 */
export async function shareLink(url: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text, url });
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    }
  }
  return copyLink(url);
}
