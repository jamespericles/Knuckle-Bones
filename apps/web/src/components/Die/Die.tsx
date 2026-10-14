import type { DieValue } from '@knucklebones/engine';
import { CELLS, hasPip } from '../../lib/pips';
import './Die.css';

export type DieTone = 'normal' | 'placed' | 'removed' | 'preview';

export interface DieProps {
  readonly value: DieValue;
  /** Shares its value with another die in the column, so it is multiplying. */
  readonly matched?: boolean | undefined;
  readonly tone?: DieTone | undefined;
  readonly size?: 'sm' | 'md' | undefined;
  readonly className?: string | undefined;
}

export function Die({ value, matched = false, tone = 'normal', size = 'md', className }: DieProps) {
  const classes = ['die', `die--${size}`, `die--${tone}`];
  if (matched) classes.push('die--matched');
  if (className) classes.push(className);
  return (
    <span
      className={classes.join(' ')}
      role="img"
      aria-label={matched ? `${value}, matched` : `${value}`}
      data-value={value}
    >
      {CELLS.map(cell => (
        <i key={cell} className={hasPip(value, cell) ? 'die__pip die__pip--on' : 'die__pip'} />
      ))}
    </span>
  );
}
