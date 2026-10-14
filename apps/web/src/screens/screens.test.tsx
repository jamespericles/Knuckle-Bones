import { createGame, decodeGame, encodeGame, placeDie } from '@knucklebones/engine';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { gameHref } from '../router/routes';
import { navigate } from '../router/useHashRoute';
import { storage } from '../state/storage';
import { HomeScreen } from './HomeScreen';
import { LocalGameScreen } from './LocalGameScreen';

// A constant rng rolls a 4 every time.
const rng = () => 0.5;
const FINISHED = '1abcdADBECFGJHKILMPNQO0';
// Player 0 is one die away from filling their board, holding a 3 for column 3.
const ONE_FROM_END = '1abcdADBECFGJHKILMPNQ3';

describe('HomeScreen', () => {
  it('offers every mode and keeps the name', async () => {
    render(<HomeScreen rng={rng} />);
    expect(screen.getByRole('heading', { name: 'Knucklebones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Play the CPU' })).toHaveAttribute(
      'href',
      '#/play/cpu/normal',
    );
    expect(screen.getByRole('link', { name: 'Easy CPU' })).toHaveAttribute(
      'href',
      '#/play/cpu/easy',
    );
    expect(screen.getByRole('link', { name: 'Pass and play' })).toHaveAttribute(
      'href',
      '#/play/pass',
    );
    await userEvent.type(screen.getByLabelText('Your name'), 'Ann');
    expect(storage.getName()).toBe('Ann');
    expect(screen.queryByRole('link', { name: /Resume/ })).toBeNull();
  });

  it('starts a link game as the named player', () => {
    storage.setName('Ann');
    render(<HomeScreen rng={rng} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play a friend by link' }));
    const code = window.location.hash.slice(gameHref('').length);
    expect(decodeGame(code).names).toEqual(['Ann', '']);
    expect(storage.listAsync()).toHaveLength(1);
  });

  it('offers to resume an unfinished local game only', () => {
    const game = placeDie(createGame({ id: 'abcd', firstRoll: 2 }), 1, { nextRoll: 3 });
    storage.setLocal({ code: encodeGame(game), mode: 'cpu', difficulty: 'easy' });
    const first = render(<HomeScreen rng={rng} />);
    expect(screen.getByRole('link', { name: 'Resume vs Easy CPU (turn 2)' })).toHaveAttribute(
      'href',
      '#/play/cpu/easy',
    );
    first.unmount();

    storage.setLocal({ code: FINISHED, mode: 'pass', difficulty: 'normal' });
    render(<HomeScreen rng={rng} />);
    expect(screen.queryByRole('link', { name: /Resume/ })).toBeNull();
  });

  it('lists link games with whose move it is and can forget them', () => {
    const mine = createGame({ id: 'aaaa', firstRoll: 2, names: ['Ann', 'Bo'] });
    const theirs = placeDie(mine, 0, { nextRoll: 5 });
    storage.setAsync('aaaa', {
      myIndex: 0,
      lastSeenTurn: 1,
      latestCode: encodeGame(mine),
      updatedAt: 1,
    });
    storage.setAsync('bbbb', {
      myIndex: 0,
      lastSeenTurn: 2,
      latestCode: encodeGame({ ...theirs, id: 'bbbb' }),
      updatedAt: 2,
    });
    storage.setAsync('cccc', { myIndex: 1, lastSeenTurn: 18, latestCode: FINISHED, updatedAt: 3 });
    storage.setAsync('dddd', { myIndex: 1, lastSeenTurn: 1, latestCode: 'junk', updatedAt: 4 });
    render(<HomeScreen rng={rng} />);
    expect(
      screen.getByRole('link', { name: 'Game aaaa: vs Bo, turn 1, your move' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Game bbbb: vs Bo, turn 2, their move' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Game cccc: vs a friend, finished' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Game dddd: unreadable' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Forget game dddd' }));
    expect(screen.queryByRole('link', { name: /dddd/ })).toBeNull();
    expect(storage.listAsync()).toHaveLength(3);
  });

  it('opens the rules', () => {
    render(<HomeScreen rng={rng} />);
    fireEvent.click(screen.getByRole('button', { name: 'How to play' }));
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('LocalGameScreen', () => {
  it('runs pass and play with attacks described', () => {
    // Player 2 holds a 4 in column 1 and player 1 is about to roll a 4.
    let game = createGame({ id: 'abcd', firstRoll: 1 });
    game = placeDie(game, 2, { nextRoll: 4 });
    game = placeDie(game, 0, { nextRoll: 4 });
    storage.setLocal({ code: encodeGame(game), mode: 'pass', difficulty: 'normal' });

    render(<LocalGameScreen mode="pass" difficulty="normal" rng={rng} />);
    expect(screen.getByRole('status')).toHaveTextContent('Player 1, you rolled a 4.');
    const mine = screen.getByRole('region', { name: "Player 1's board" });
    const target = mine.querySelector('button[aria-label^="Column 1"]');
    expect(target).not.toBeNull();
    fireEvent.click(target as HTMLButtonElement);

    expect(screen.getByRole('status')).toHaveTextContent('Player 2, you rolled a 4.');
    expect(screen.getByRole('status')).toHaveTextContent(
      "Player 1 cleared a 4 from Player 2's column 1.",
    );
    expect(screen.getByTestId('score-Player 1')).toHaveTextContent('5');
    expect(screen.getByTestId('score-Player 2')).toHaveTextContent('0');
  });

  it('lets the CPU answer and shows a result overlay at the end', async () => {
    render(<LocalGameScreen mode="cpu" difficulty="normal" rng={rng} cpuDelayMs={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('Your turn. You rolled a 4.');
    const mine = screen.getByRole('region', { name: "You's board" });
    fireEvent.click(mine.querySelector('button[aria-label^="Column 2"]') as HTMLButtonElement);
    expect(screen.getByRole('status')).toHaveTextContent('CPU is thinking');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your turn.'));
    await waitFor(() => expect(screen.getByTestId('score-CPU')).toHaveTextContent('4'));
  });

  it('shows the result and starts over on Play again', () => {
    storage.setLocal({ code: ONE_FROM_END, mode: 'pass', difficulty: 'normal' });
    render(<LocalGameScreen mode="pass" difficulty="normal" rng={rng} />);
    const mine = screen.getByRole('region', { name: "Player 1's board" });
    fireEvent.click(mine.querySelector('button[aria-label^="Column 3"]') as HTMLButtonElement);
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeInTheDocument();
    expect(screen.getByText('Player 2 wins.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Game over. Player 2 wins.');
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Player 1, you rolled a');
    fireEvent.click(screen.getByRole('button', { name: 'How to play' }));
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
  });
});

describe('AsyncGameScreen', () => {
  function renderCode(code: string) {
    window.history.replaceState(null, '', `/${gameHref(code)}`);
    return render(<App rng={rng} />);
  }

  it('explains a broken link', () => {
    renderCode('nope');
    expect(screen.getByRole('heading', { name: 'Broken link' })).toBeInTheDocument();
    expect(screen.getByText(/bad-version/)).toBeInTheDocument();
  });

  it('plays a turn, offers the share sheet, then waits', async () => {
    renderCode(encodeGame(createGame({ id: 'abcd', firstRoll: 2 })));
    expect(screen.getByRole('status')).toHaveTextContent('Your turn, You. You rolled a 2.');
    await userEvent.type(screen.getByLabelText('Your name'), 'Ann');
    const mine = screen.getByRole('region', { name: "Ann's board" });
    fireEvent.click(mine.querySelector('button[aria-label^="Column 2"]') as HTMLButtonElement);

    expect(screen.getByRole('dialog', { name: 'Send your move' })).toBeInTheDocument();
    expect(screen.getByText(/Your move is in\. Send this link to Your friend/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for Your friend to play turn 2.');
    expect(window.location.hash).toMatch(/^#\/g\/1abcdH/);

    fireEvent.click(screen.getByRole('button', { name: 'Send link' }));
    expect(screen.getByRole('dialog', { name: 'Send your move' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.click(screen.getByRole('button', { name: 'Play as Your friend' }));
    expect(screen.getByRole('status')).toHaveTextContent('Your turn, You. You rolled a 4.');
    expect(screen.getByRole('region', { name: "Ann's board" })).toBeInTheDocument();
  });

  it('highlights the friend move on the receiving side', () => {
    const game = placeDie(createGame({ id: 'abcd', firstRoll: 2 }), 1, { nextRoll: 6 });
    const { container } = renderCode(encodeGame(game));
    expect(screen.getByRole('status')).toHaveTextContent('Your turn, You. You rolled a 6.');
    expect(container.querySelector('.column--highlight')).not.toBeNull();
    expect(container.querySelector('.die--placed')).not.toBeNull();
  });

  it('flags a stale link and jumps to the latest', async () => {
    const latest = placeDie(createGame({ id: 'abcd', firstRoll: 2 }), 1, { nextRoll: 6 });
    storage.setAsync('abcd', {
      myIndex: 1,
      lastSeenTurn: 2,
      latestCode: encodeGame(latest),
      updatedAt: 1,
    });
    renderCode(encodeGame(createGame({ id: 'abcd', firstRoll: 2 })));
    expect(screen.getByRole('status')).toHaveTextContent(
      'This link is from turn 1. Your latest is turn 2.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open latest' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Your turn, You. You rolled a 6.'),
    );
  });

  it('shows the result of a finished game and offers a rematch', () => {
    renderCode(FINISHED);
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeInTheDocument();
    expect(screen.getByText('You lose.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rematch' }));
    expect(window.location.hash).toMatch(/^#\/g\/1/);
    expect(window.location.hash).not.toContain('abcd');
  });
});

describe('App routing', () => {
  it('switches screens with the hash', () => {
    render(<App rng={rng} cpuDelayMs={0} />);
    expect(screen.getByRole('heading', { name: 'Knucklebones' })).toBeInTheDocument();
    act(() => navigate('#/play/pass', { replace: true }));
    expect(screen.getByRole('heading', { name: 'Pass and play' })).toBeInTheDocument();
    act(() => navigate('#/play/cpu/easy', { replace: true }));
    expect(screen.getByRole('heading', { name: 'You vs CPU' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: "Easy CPU's board" })).toBeInTheDocument();
    act(() => navigate('#/nowhere', { replace: true }));
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
  });
});
