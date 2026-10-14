import type { Difficulty, Rng } from '@knucklebones/engine';
import { useState } from 'react';
import { Board } from '../components/Board/Board';
import { RollTray } from '../components/RollTray/RollTray';
import { TurnBanner } from '../components/RollTray/TurnBanner';
import type { BannerTone } from '../components/RollTray/TurnBanner';
import { ResultOverlay } from '../components/Sheet/ResultOverlay';
import { RulesSheet } from '../components/Sheet/RulesSheet';
import { describeAttack, resultLine } from '../lib/text';
import type { Names } from '../lib/text';
import { CPU_PLAYER } from '../state/gameReducer';
import { storage } from '../state/storage';
import type { LocalMode } from '../state/storage';
import { useLocalGame } from '../state/useLocalGame';
import { GameTop } from './GameTop';

export interface LocalGameScreenProps {
  readonly mode: LocalMode;
  readonly difficulty: Difficulty;
  readonly rng?: Rng | undefined;
  readonly cpuDelayMs?: number | undefined;
}

export function LocalGameScreen({ mode, difficulty, rng, cpuDelayMs }: LocalGameScreenProps) {
  const { state, place, newGame, humanTurn } = useLocalGame(mode, difficulty, { rng, cpuDelayMs });
  const { game, event } = state;
  const [rulesOpen, setRulesOpen] = useState(false);

  const names: Names =
    mode === 'cpu'
      ? [storage.getName() || 'You', difficulty === 'easy' ? 'Easy CPU' : 'CPU']
      : ['Player 1', 'Player 2'];
  const perspective = mode === 'cpu' ? 0 : null;
  const playing = game.status === 'playing';

  let message: string;
  let tone: BannerTone = 'neutral';
  let prompt: string;
  if (!playing) {
    message = `Game over. ${resultLine(game, names, perspective)}`;
    tone = game.winner === 'draw' ? 'neutral' : game.winner === perspective ? 'good' : 'bad';
    prompt = 'The board is full.';
  } else if (mode === 'cpu' && game.current === CPU_PLAYER) {
    message = `${names[CPU_PLAYER]} is thinking…`;
    prompt = 'Waiting for the CPU.';
  } else if (mode === 'cpu') {
    message = `Your turn. You rolled a ${game.roll ?? ''}.`;
    prompt = 'Tap a column to place your die.';
  } else {
    message = `${names[game.current]}, you rolled a ${game.roll ?? ''}.`;
    prompt = 'Tap a column on your board.';
  }
  const detail = event ? describeAttack(event, names) : null;

  return (
    <div className="game">
      <GameTop
        title={mode === 'cpu' ? 'You vs CPU' : 'Pass and play'}
        onRules={() => setRulesOpen(true)}
      >
        <TurnBanner message={message} detail={detail} tone={tone} />
      </GameTop>
      <Board
        board={game.boards[1]}
        owner={1}
        name={names[1]}
        flipped
        active={playing && game.current === 1}
        interactive={humanTurn && game.current === 1}
        roll={game.roll}
        onPlace={place}
        event={event}
      />
      <div className="seam" aria-hidden="true">
        vs
      </div>
      <Board
        board={game.boards[0]}
        owner={0}
        name={names[0]}
        flipped={false}
        active={playing && game.current === 0}
        interactive={humanTurn && game.current === 0}
        roll={game.roll}
        onPlace={place}
        event={event}
      />
      <RollTray roll={game.roll} prompt={prompt} busy={playing && !humanTurn} />
      <ResultOverlay
        game={game}
        names={names}
        perspective={perspective}
        primaryLabel="Play again"
        onPrimary={newGame}
      />
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
