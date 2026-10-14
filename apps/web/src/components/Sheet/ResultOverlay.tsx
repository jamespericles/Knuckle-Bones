import { scores } from '@knucklebones/engine';
import type { GameState, PlayerIndex } from '@knucklebones/engine';
import { useState } from 'react';
import { resultLine } from '../../lib/text';
import type { Names } from '../../lib/text';
import { homeHref } from '../../router/routes';
import { Button } from '../Button/Button';
import { Sheet } from './Sheet';

export interface ResultOverlayProps {
  readonly game: GameState;
  readonly names: Names;
  /** Which seat "you" sit in, or null for a neutral summary. */
  readonly perspective: PlayerIndex | null;
  readonly primaryLabel: string;
  readonly onPrimary: () => void;
}

export function ResultOverlay(props: ResultOverlayProps) {
  const { game, names, perspective, primaryLabel, onPrimary } = props;
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const key = `${game.id}:${game.history.length}`;
  const open = game.status === 'finished' && dismissedFor !== key;
  const [a, b] = scores(game);

  return (
    <Sheet open={open} title="Game over" onClose={() => setDismissedFor(key)}>
      <div className="result">
        <p className="result__headline">{resultLine(game, names, perspective)}</p>
        <div className="result__scores">
          <div className="result__score">
            <strong>{a}</strong>
            <span className="muted small">{names[0]}</span>
          </div>
          <div className="result__score">
            <strong>{b}</strong>
            <span className="muted small">{names[1]}</span>
          </div>
        </div>
        <div className="sheet__actions">
          <Button onClick={onPrimary} autoFocus>
            {primaryLabel}
          </Button>
          <Button variant="secondary" href={homeHref()}>
            Home
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setDismissedFor(key)}>
          Look at the board
        </Button>
      </div>
    </Sheet>
  );
}
