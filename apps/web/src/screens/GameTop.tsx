import type { ReactNode } from 'react';
import { homeHref } from '../router/routes';
import { Button } from '../components/Button/Button';
import './Game.css';

export interface GameTopProps {
  readonly title: string;
  readonly onRules: () => void;
  readonly children?: ReactNode;
}

/** The strip above the boards: home link, title, rules button, then the turn banner. */
export function GameTop({ title, onRules, children }: GameTopProps) {
  return (
    <div className="game__top">
      <div className="game__bar">
        <Button variant="ghost" small href={homeHref()} ariaLabel="Home">
          ← Home
        </Button>
        <h1 className="game__title">{title}</h1>
        <Button variant="ghost" small onClick={onRules} ariaLabel="How to play">
          ?
        </Button>
      </div>
      {children}
    </div>
  );
}
