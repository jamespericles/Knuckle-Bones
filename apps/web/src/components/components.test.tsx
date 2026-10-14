import { boardOf, columnOf, createGame } from '@knucklebones/engine';
import type { GameState } from '@knucklebones/engine';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UiEvent } from '../state/gameReducer';
import { Board } from './Board/Board';
import { ScoreBadge } from './Board/ScoreBadge';
import { Button } from './Button/Button';
import { Column } from './Column/Column';
import { Die } from './Die/Die';
import { NameField } from './NameField/NameField';
import { RollTray } from './RollTray/RollTray';
import { TurnBanner } from './RollTray/TurnBanner';
import { ResultOverlay } from './Sheet/ResultOverlay';
import { RulesSheet } from './Sheet/RulesSheet';
import { ShareMoveSheet } from './Sheet/ShareMoveSheet';
import { Sheet } from './Sheet/Sheet';

describe('Die', () => {
  it('draws the right number of pips and labels itself', () => {
    const { container } = render(<Die value={4} />);
    expect(screen.getByRole('img', { name: '4' })).toBeInTheDocument();
    expect(container.querySelectorAll('.die__pip--on')).toHaveLength(4);
    expect(container.querySelectorAll('.die__pip')).toHaveLength(9);
  });

  it('marks matched, tone, size and extra classes', () => {
    render(<Die value={6} matched tone="placed" size="sm" className="extra" />);
    const die = screen.getByRole('img', { name: '6, matched' });
    expect(die).toHaveClass('die--matched', 'die--placed', 'die--sm', 'extra');
  });
});

describe('Column', () => {
  const event: UiEvent = {
    serial: 7,
    placed: { player: 0, column: 0, slot: 1, die: 4 },
    removed: { player: 1, column: 0, die: 4, slots: [0, 2] },
  };

  it('is a button that reports the resulting score when interactive', () => {
    const onPlace = vi.fn();
    render(
      <Column
        column={columnOf(4)}
        index={0}
        owner={0}
        flipped={false}
        interactive
        roll={4}
        onPlace={onPlace}
      />,
    );
    const button = screen.getByRole('button', { name: 'Column 1: place a 4, score 4 becomes 16' });
    fireEvent.click(button);
    expect(onPlace).toHaveBeenCalledWith(0);
    expect(button).toHaveClass('column--open');
    expect(button.querySelector('.die--preview')).not.toBeNull();
  });

  it('is disabled when full or without a roll', () => {
    render(
      <Column
        column={columnOf(1, 2, 3)}
        index={1}
        owner={0}
        flipped={false}
        interactive
        roll={4}
      />,
    );
    expect(screen.getByRole('button', { name: 'Column 2 is full' })).toBeDisabled();
    render(
      <Column column={columnOf()} index={2} owner={0} flipped={false} interactive roll={null} />,
    );
    expect(screen.getByRole('button', { name: /Column 3/ })).toBeDisabled();
  });

  it('is a labelled group otherwise, with matched dice marked', () => {
    render(
      <Column
        column={columnOf(4, 4)}
        index={1}
        owner={1}
        flipped
        interactive={false}
        roll={4}
        highlight
      />,
    );
    const group = screen.getByRole('group', { name: 'Column 2, score 16' });
    expect(group).toHaveClass('column--flipped', 'column--highlight');
    expect(screen.getAllByRole('img', { name: '4, matched' })).toHaveLength(2);
  });

  it('animates the placed die and ghosts of removed dice', () => {
    const { container, rerender } = render(
      <Column
        column={columnOf(4, 4)}
        index={0}
        owner={0}
        flipped={false}
        interactive={false}
        roll={null}
        event={event}
      />,
    );
    expect(container.querySelectorAll('.die--placed')).toHaveLength(1);
    expect(container.querySelectorAll('.die--removed')).toHaveLength(0);

    rerender(
      <Column
        column={columnOf(2)}
        index={0}
        owner={1}
        flipped
        interactive={false}
        roll={null}
        event={event}
      />,
    );
    expect(container.querySelectorAll('.die--removed')).toHaveLength(2);
    expect(container.querySelector('.column')).toHaveClass('column--hit');
  });
});

describe('Board and ScoreBadge', () => {
  it('renders the name, total and three columns', () => {
    const board = boardOf(columnOf(4, 4), columnOf(1), columnOf());
    render(
      <Board
        board={board}
        owner={0}
        name="Ann"
        flipped={false}
        active
        interactive={false}
        roll={null}
        highlightColumn={1}
      />,
    );
    expect(screen.getByRole('region', { name: "Ann's board" })).toHaveClass('board--active');
    expect(screen.getByTestId('score-Ann')).toHaveTextContent('17');
    expect(screen.getAllByRole('group')).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Column 2, score 1' })).toHaveClass(
      'column--highlight',
    );
  });

  it('ScoreBadge shows the value with an accessible label', () => {
    render(<ScoreBadge value={23} label="Bo" emphasis />);
    expect(screen.getByLabelText('Bo score 23')).toHaveTextContent('23');
    expect(screen.getByTestId('score-Bo')).toHaveClass('score--emphasis');
  });
});

describe('Button', () => {
  it('renders a link when given an href', () => {
    render(
      <Button href="#/play/pass" variant="secondary" small>
        Go
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('href', '#/play/pass');
    expect(link).toHaveClass('btn--secondary', 'btn--small');
  });

  it('renders a button otherwise', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} ariaLabel="Do it" className="x" variant="ghost">
        Do
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Do it' }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveClass('btn--ghost', 'x');
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
  });
});

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Sheet open={false} title="T" onClose={() => undefined}>
        x
      </Sheet>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('closes on Escape, backdrop and the close button but not on panel clicks', () => {
    const onClose = vi.fn();
    render(
      <Sheet open title="Title" onClose={onClose}>
        <p>Body</p>
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Title' });
    expect(dialog).toHaveFocus();
    fireEvent.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.click(screen.getByTestId('sheet-backdrop'));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('RollTray and TurnBanner', () => {
  it('shows the roll, prompt and actions', () => {
    render(
      <RollTray roll={5} prompt="Tap a column" busy>
        <button type="button">Act</button>
      </RollTray>,
    );
    expect(screen.getByRole('img', { name: '5' })).toBeInTheDocument();
    expect(screen.getByText('Tap a column')).toHaveClass('tray__prompt--busy');
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument();
  });

  it('shows an empty socket without a roll', () => {
    const { container } = render(<RollTray roll={null} prompt="Wait" />);
    expect(container.querySelector('.tray__empty')).not.toBeNull();
    expect(container.querySelector('.tray__actions')).toBeNull();
  });

  it('announces the turn with an optional detail and tone', () => {
    render(<TurnBanner message="Your turn" detail="They cleared a 5." tone="good" />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Your turn');
    expect(banner).toHaveTextContent('They cleared a 5.');
    expect(banner).toHaveClass('banner--good');
    render(<TurnBanner message="Plain" />);
    expect(screen.getByText('Plain').closest('p')).not.toHaveClass('banner--good');
  });
});

describe('NameField', () => {
  it('edits a bounded name', async () => {
    const onChange = vi.fn();
    render(<NameField value="" onChange={onChange} label="Name" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('maxlength', '16');
    await userEvent.type(input, 'A');
    expect(onChange).toHaveBeenCalledWith('A');
  });
});

describe('ShareMoveSheet', () => {
  const props = { open: true, url: 'https://x/#/g/1', text: 'Turn 2', intro: 'Send it' };

  it('shares through the share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: share });
    render(<ShareMoveSheet {...props} onClose={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Sent.');
    expect(share).toHaveBeenCalledWith({ text: 'Turn 2', url: 'https://x/#/g/1' });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it('copies, shows the link, and resets on Done', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });
    const onClose = vi.fn();
    render(<ShareMoveSheet {...props} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied');
    const box = screen.getByLabelText('Game link');
    expect(box).toHaveValue('https://x/#/g/1');
    fireEvent.focus(box);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it('asks for a manual copy when nothing is available', async () => {
    render(<ShareMoveSheet {...props} onClose={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Copy the link below');
    expect(screen.getByLabelText('Game link')).toBeInTheDocument();
  });
});

describe('ResultOverlay', () => {
  const base = createGame({ id: 'abcd', firstRoll: 1 });
  const finished: GameState = {
    ...base,
    boards: [boardOf(columnOf(6, 6)), boardOf(columnOf(1))],
    status: 'finished',
    winner: 0,
    roll: null,
  };

  it('stays hidden while the game is on', () => {
    render(
      <ResultOverlay
        game={base}
        names={['Ann', 'Bo']}
        perspective={null}
        primaryLabel="Again"
        onPrimary={() => undefined}
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the result, scores and actions, and can be dismissed', () => {
    const onPrimary = vi.fn();
    render(
      <ResultOverlay
        game={finished}
        names={['Ann', 'Bo']}
        perspective={1}
        primaryLabel="Again"
        onPrimary={onPrimary}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Game over' })).toBeInTheDocument();
    expect(screen.getByText('You lose.')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#/');
    fireEvent.click(screen.getByRole('button', { name: 'Again' }));
    expect(onPrimary).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Look at the board' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('RulesSheet', () => {
  it('explains the rules with dice examples', () => {
    render(<RulesSheet open onClose={() => undefined} />);
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
    expect(screen.getByText('Two 4s score 16.')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: '4, matched' })).toHaveLength(5);
  });
});
