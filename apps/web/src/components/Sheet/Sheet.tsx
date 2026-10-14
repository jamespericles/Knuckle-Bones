import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import './Sheet.css';

export interface SheetProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** A bottom sheet on phones, a centred dialog on wide screens. Esc or the backdrop closes it. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet" onClick={onClose} data-testid="sheet-backdrop">
      <div
        ref={panelRef}
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <div className="sheet__head">
          <h2 id={titleId} className="sheet__title">
            {title}
          </h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
