import { defaultRng, tryDecodeGame, turnNumber } from '@knucklebones/engine';
import type { Rng } from '@knucklebones/engine';
import { useState } from 'react';
import { Button } from '../components/Button/Button';
import { NameField } from '../components/NameField/NameField';
import { RulesSheet } from '../components/Sheet/RulesSheet';
import { cpuHref, gameHref, passHref } from '../router/routes';
import { navigate } from '../router/useHashRoute';
import { storage } from '../state/storage';
import type { AsyncEntry } from '../state/storage';
import { createLinkGame } from '../state/useAsyncGame';
import './Home.css';

export interface HomeScreenProps {
  readonly rng?: Rng | undefined;
}

interface SavedLocal {
  readonly href: string;
  readonly label: string;
  readonly turn: number;
}

function readSavedLocal(): SavedLocal | null {
  const saved = storage.getLocal();
  if (!saved) return null;
  const decoded = tryDecodeGame(saved.code);
  if (!decoded.ok || decoded.state.status !== 'playing') return null;
  return {
    href: saved.mode === 'cpu' ? cpuHref(saved.difficulty) : passHref(),
    label:
      saved.mode === 'cpu'
        ? `vs ${saved.difficulty === 'easy' ? 'Easy CPU' : 'CPU'}`
        : 'pass and play',
    turn: turnNumber(decoded.state),
  };
}

function describeEntry(entry: AsyncEntry): string {
  const decoded = tryDecodeGame(entry.record.latestCode);
  if (!decoded.ok) return 'unreadable';
  const game = decoded.state;
  const opponent = game.names[entry.record.myIndex === 0 ? 1 : 0] || 'a friend';
  if (game.status === 'finished') return `vs ${opponent}, finished`;
  const whose = game.current === entry.record.myIndex ? 'your move' : 'their move';
  return `vs ${opponent}, turn ${turnNumber(game)}, ${whose}`;
}

export function HomeScreen({ rng = defaultRng }: HomeScreenProps) {
  const [name, setName] = useState(() => storage.getName());
  const [rulesOpen, setRulesOpen] = useState(false);
  const [saved] = useState(readSavedLocal);
  const [linkGames, setLinkGames] = useState(() => storage.listAsync());

  const onNameChange = (value: string) => {
    setName(value);
    storage.setName(value);
  };
  const startLinkGame = () => {
    navigate(gameHref(createLinkGame(name, rng)));
  };
  const forget = (id: string) => {
    storage.removeAsync(id);
    setLinkGames(storage.listAsync());
  };

  return (
    <div className="home">
      <header className="home__hero">
        <h1 className="home__title">Knucklebones</h1>
        <p className="muted">Roll. Stack. Wipe them out.</p>
      </header>

      <NameField value={name} onChange={onNameChange} />

      {saved ? (
        <Button variant="secondary" href={saved.href}>
          Resume {saved.label} (turn {saved.turn})
        </Button>
      ) : null}

      <nav className="home__modes" aria-label="Game modes">
        <Button href={cpuHref('normal')}>Play the CPU</Button>
        <Button variant="secondary" href={cpuHref('easy')}>
          Easy CPU
        </Button>
        <Button variant="secondary" href={passHref()}>
          Pass and play
        </Button>
        <Button variant="secondary" onClick={startLinkGame}>
          Play a friend by link
        </Button>
      </nav>

      {linkGames.length > 0 ? (
        <section className="home__games" aria-labelledby="link-games">
          <h2 id="link-games" className="home__subtitle">
            Your link games
          </h2>
          <ul className="home__list">
            {linkGames.map(entry => (
              <li key={entry.id} className="home__game">
                <a href={gameHref(entry.record.latestCode)}>
                  Game {entry.id}: {describeEntry(entry)}
                </a>
                <button
                  type="button"
                  className="home__forget"
                  aria-label={`Forget game ${entry.id}`}
                  onClick={() => forget(entry.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button variant="ghost" onClick={() => setRulesOpen(true)}>
        How to play
      </Button>
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
