import { useAnimatedNumber, usePrefersReducedMotion } from '../../lib/motion';

export interface ScoreBadgeProps {
  readonly value: number;
  readonly label: string;
  readonly emphasis?: boolean | undefined;
}

export function ScoreBadge({ value, label, emphasis = false }: ScoreBadgeProps) {
  const reduced = usePrefersReducedMotion();
  const shown = useAnimatedNumber(value, reduced);
  return (
    <span
      className={emphasis ? 'score score--emphasis' : 'score'}
      aria-label={`${label} score ${value}`}
      data-testid={`score-${label}`}
    >
      {shown}
    </span>
  );
}
