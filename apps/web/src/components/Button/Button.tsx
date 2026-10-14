import type { ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant | undefined;
  /** Render as a link to this hash route instead of a button. */
  readonly href?: string | undefined;
  readonly onClick?: (() => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly autoFocus?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
  readonly className?: string | undefined;
  readonly small?: boolean | undefined;
}

export function Button(props: ButtonProps) {
  const { children, variant = 'primary', href, onClick, disabled, autoFocus, ariaLabel } = props;
  const classes = ['btn', `btn--${variant}`];
  if (props.small) classes.push('btn--small');
  if (props.className) classes.push(props.className);
  const className = classes.join(' ');

  if (href !== undefined) {
    return (
      <a className={className} href={href} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
