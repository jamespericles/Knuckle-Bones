export type BannerTone = 'neutral' | 'good' | 'bad';

export interface TurnBannerProps {
  readonly message: string;
  readonly detail?: string | null | undefined;
  readonly tone?: BannerTone | undefined;
}

/** A polite live region, so screen readers hear each turn change. */
export function TurnBanner({ message, detail = null, tone = 'neutral' }: TurnBannerProps) {
  const className = tone === 'neutral' ? 'banner' : `banner banner--${tone}`;
  return (
    <p className={className} role="status" aria-live="polite">
      <span>{message}</span>
      {detail ? <span className="banner__detail">{detail}</span> : null}
    </p>
  );
}
