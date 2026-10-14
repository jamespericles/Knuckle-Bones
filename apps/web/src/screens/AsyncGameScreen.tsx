import { defaultRng, opponentOf, turnNumber } from '@knucklebones/engine';
import type { ColumnIndex, Rng } from '@knucklebones/engine';
import { useState } from 'react';
import { Board } from '../components/Board/Board';
import { Button } from '../components/Button/Button';
import { NameField } from '../components/NameField/NameField';
import { RollTray } from '../components/RollTray/RollTray';
import { TurnBanner } from '../components/RollTray/TurnBanner';
import type { BannerTone } from '../components/RollTray/TurnBanner';
import { ResultOverlay } from '../components/Sheet/ResultOverlay';
import { RulesSheet } from '../components/Sheet/RulesSheet';
import { ShareMoveSheet } from '../components/Sheet/ShareMoveSheet';
import { describeAttack, resultLine } from '../lib/text';
import type { Names } from '../lib/text';
import { absoluteGameUrl, gameHref, homeHref } from '../router/routes';
import { navigate } from '../router/useHashRoute';
import { storage } from '../state/storage';
import { createLinkGame, useAsyncGame } from '../state/useAsyncGame';
import { GameTop } from './GameTop';

export interface AsyncGameScreenProps {
  readonly code: string;
  readonly rng?: Rng | undefined;
}

export function AsyncGameScreen({ code, rng = defaultRng }: AsyncGameScreenProps) {
  const { view, lastEvent, justSent, place, takeSeat, openLatest } = useAsyncGame(code, rng);
  const [name, setName] = useState(() => storage.getName());
  const [shareOpen, setShareOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  if (view.kind === 'broken') {
    return (
      <div className="notice">
        <h1>Broken link</h1>
        <p className="muted">
          This link is not a valid Knucklebones game ({view.reason}). Ask your friend to send it
          again.
        </p>
        <Button href={homeHref()}>Home</Button>
      </div>
    );
  }

  const { game, myIndex } = view;
  const opponent = opponentOf(myIndex);
  const myName = game.names[myIndex] || name.trim() || 'You';
  const oppName = game.names[opponent] || 'Your friend';
  const names: Names = myIndex === 0 ? [myName, oppName] : [oppName, myName];
  const myTurn = view.kind === 'my-turn';
  const turn = turnNumber(game);
  const highlightColumn =
    lastEvent && lastEvent.placed.player === opponent ? lastEvent.placed.column : null;
  const detail = lastEvent ? describeAttack(lastEvent, names) : null;

  let message: string;
  let tone: BannerTone = 'neutral';
  let prompt: string;
  switch (view.kind) {
    case 'finished':
      message = `Game over. ${resultLine(game, names, myIndex)}`;
      tone = game.winner === 'draw' ? 'neutral' : game.winner === myIndex ? 'good' : 'bad';
      prompt = 'The board is full.';
      break;
    case 'stale':
      message = `This link is from turn ${turn}. Your latest is turn ${view.latestTurn}.`;
      tone = 'bad';
      prompt = 'Open your latest link to keep playing.';
      break;
    case 'waiting':
      message = `Waiting for ${oppName} to play turn ${turn}.`;
      prompt = justSent
        ? 'Your move is in. Send the link.'
        : 'Send the link and wait for their move.';
      break;
    case 'my-turn':
      message = `Your turn, ${myName}. You rolled a ${game.roll ?? ''}.`;
      tone = 'good';
      prompt = view.needsName
        ? 'Add your name, then tap a column.'
        : 'Tap a column to place your die.';
      break;
  }

  const onPlace = (column: ColumnIndex) => {
    place(column, name);
    setShareOpen(true);
  };
  const onTakeSeat = () => {
    setName('');
    takeSeat();
  };
  const rematch = () => {
    navigate(gameHref(createLinkGame(myName === 'You' ? '' : myName, rng)));
  };

  return (
    <div className="game">
      <GameTop title={`Turn ${turn}`} onRules={() => setRulesOpen(true)}>
        <TurnBanner message={message} detail={detail} tone={tone} />
        {view.kind === 'my-turn' && view.needsName ? (
          <div className="game__name">
            <NameField value={name} onChange={setName} autoFocus />
          </div>
        ) : null}
      </GameTop>
      <Board
        board={game.boards[opponent]}
        owner={opponent}
        name={oppName}
        flipped
        active={game.status === 'playing' && game.current === opponent}
        interactive={false}
        roll={game.roll}
        event={lastEvent}
        highlightColumn={highlightColumn}
      />
      <div className="seam" aria-hidden="true">
        vs
      </div>
      <Board
        board={game.boards[myIndex]}
        owner={myIndex}
        name={myName}
        flipped={false}
        active={game.status === 'playing' && game.current === myIndex}
        interactive={myTurn}
        roll={game.roll}
        onPlace={onPlace}
        event={lastEvent}
      />
      <RollTray roll={myTurn ? game.roll : null} prompt={prompt} busy={view.kind === 'waiting'}>
        {view.kind === 'waiting' ? (
          <>
            <Button small onClick={() => setShareOpen(true)}>
              Send link
            </Button>
            <Button small variant="ghost" onClick={onTakeSeat}>
              Play as {oppName}
            </Button>
          </>
        ) : null}
        {view.kind === 'stale' ? (
          <Button small onClick={openLatest}>
            Open latest
          </Button>
        ) : null}
      </RollTray>
      <ShareMoveSheet
        open={shareOpen}
        url={absoluteGameUrl(code)}
        text={`Knucklebones, turn ${turn}. Your move!`}
        intro={
          justSent
            ? `Your move is in. Send this link to ${oppName} so they can play turn ${turn}.`
            : `Send this link to ${oppName}. They open it to play turn ${turn}.`
        }
        onClose={() => setShareOpen(false)}
      />
      <ResultOverlay
        game={game}
        names={names}
        perspective={myIndex}
        primaryLabel="Rematch"
        onPrimary={rematch}
      />
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
