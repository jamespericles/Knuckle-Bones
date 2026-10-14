import type { DieValue } from '@knucklebones/engine';
import type { ReactNode } from 'react';
import { Die } from '../Die/Die';
import './RollTray.css';

export interface RollTrayProps {
  readonly roll: DieValue | null;
  readonly prompt: string;
  /** Someone else is acting; dim the prompt and pulse it. */
  readonly busy?: boolean | undefined;
  readonly children?: ReactNode;
}

export function RollTray({ roll, prompt, busy = false, children }: RollTrayProps) {
  return (
    <div className="tray" data-testid="tray">
      <div className="tray__die">
        {roll !== null ? <Die value={roll} /> : <span className="tray__empty" aria-hidden="true" />}
      </div>
      <div className="tray__text">
        <p className={busy ? 'tray__prompt tray__prompt--busy' : 'tray__prompt'}>{prompt}</p>
        {children ? <div className="tray__actions">{children}</div> : null}
      </div>
    </div>
  );
}
