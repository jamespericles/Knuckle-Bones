import { ALL_COLUMNS, scoreBoard } from '@knucklebones/engine';
import type { Board as BoardModel, ColumnIndex, DieValue, PlayerIndex } from '@knucklebones/engine';
import type { UiEvent } from '../../state/gameReducer';
import { Column } from '../Column/Column';
import { ScoreBadge } from './ScoreBadge';
import './Board.css';

export interface BoardProps {
  readonly board: BoardModel;
  readonly owner: PlayerIndex;
  readonly name: string;
  /** The board across the table: drawn upside down so columns line up. */
  readonly flipped: boolean;
  /** This player is the one to move. */
  readonly active: boolean;
  /** The owner may tap a column right now. */
  readonly interactive: boolean;
  readonly roll: DieValue | null;
  readonly onPlace?: ((column: ColumnIndex) => void) | undefined;
  readonly event?: UiEvent | null | undefined;
  readonly highlightColumn?: ColumnIndex | null | undefined;
}

export function Board(props: BoardProps) {
  const { board, owner, name, flipped, active, interactive, roll, onPlace } = props;
  const event = props.event ?? null;
  const highlightColumn = props.highlightColumn ?? null;
  const total = scoreBoard(board);

  const classes = ['board'];
  if (flipped) classes.push('board--flipped');
  if (active) classes.push('board--active');

  return (
    <section className={classes.join(' ')} aria-label={`${name}'s board`}>
      <header className="board__header">
        <span className="board__name">{name}</span>
        <ScoreBadge value={total} label={name} emphasis={active} />
      </header>
      <div className="board__columns">
        {ALL_COLUMNS.map(index => (
          <Column
            key={index}
            column={board[index]}
            index={index}
            owner={owner}
            flipped={flipped}
            interactive={interactive}
            roll={roll}
            onPlace={onPlace}
            event={event}
            highlight={highlightColumn === index}
          />
        ))}
      </div>
    </section>
  );
}
