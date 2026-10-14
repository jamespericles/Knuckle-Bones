import { addDie, countOf, isColumnFull, scoreColumn } from '@knucklebones/engine';
import type {
  Column as ColumnModel,
  ColumnIndex,
  DieValue,
  PlayerIndex,
} from '@knucklebones/engine';
import type { UiEvent } from '../../state/gameReducer';
import { Die } from '../Die/Die';
import './Column.css';

export interface ColumnProps {
  readonly column: ColumnModel;
  readonly index: ColumnIndex;
  readonly owner: PlayerIndex;
  /** Draw slot 0 at the top, for the board across the table. */
  readonly flipped: boolean;
  /** The owner may tap this column to place `roll`. */
  readonly interactive: boolean;
  readonly roll: DieValue | null;
  readonly onPlace?: ((column: ColumnIndex) => void) | undefined;
  readonly event?: UiEvent | null | undefined;
  /** Emphasise this column as the opponent's last move. */
  readonly highlight?: boolean | undefined;
}

const SLOTS = [0, 1, 2] as const;

export function Column(props: ColumnProps) {
  const { column, index, owner, flipped, interactive, roll, onPlace, highlight = false } = props;
  const event = props.event ?? null;
  const score = scoreColumn(column);
  const full = isColumnFull(column);
  const placed =
    event && event.placed.player === owner && event.placed.column === index ? event.placed : null;
  const removed =
    event && event.removed && event.removed.player === owner && event.removed.column === index
      ? event.removed
      : null;
  const previewSlot = interactive && !full && roll !== null ? column.indexOf(null) : -1;

  const classes = ['column'];
  if (flipped) classes.push('column--flipped');
  if (interactive && !full) classes.push('column--open');
  if (highlight) classes.push('column--highlight');
  if (removed) classes.push('column--hit');

  const slots = SLOTS.map(slot => {
    const value = column[slot];
    const isPlaced = placed !== null && placed.slot === slot;
    const ghost = removed && removed.slots.includes(slot) ? removed : null;
    return (
      <span
        key={slot}
        className={value === null ? 'column__slot column__slot--empty' : 'column__slot'}
      >
        {value !== null ? (
          <Die
            key={isPlaced && event ? `placed-${event.serial}` : `die-${slot}`}
            value={value}
            matched={countOf(column, value) > 1}
            tone={isPlaced ? 'placed' : 'normal'}
          />
        ) : null}
        {slot === previewSlot && roll !== null ? (
          <Die value={roll} tone="preview" className="column__preview" />
        ) : null}
        {ghost && event ? (
          <Die key={`ghost-${event.serial}`} value={ghost.die} tone="removed" />
        ) : null}
      </span>
    );
  });

  const scoreLabel = <span className="column__score">{score}</span>;

  if (interactive) {
    const after = roll !== null && !full ? scoreColumn(addDie(column, roll)) : score;
    const label = full
      ? `Column ${index + 1} is full`
      : `Column ${index + 1}: place a ${roll ?? ''}, score ${score} becomes ${after}`;
    return (
      <button
        type="button"
        className={classes.join(' ')}
        aria-label={label}
        disabled={full || roll === null}
        onClick={() => onPlace?.(index)}
      >
        <span className="column__slots">{slots}</span>
        {scoreLabel}
      </button>
    );
  }

  return (
    <div
      className={classes.join(' ')}
      role="group"
      aria-label={`Column ${index + 1}, score ${score}`}
    >
      <span className="column__slots">{slots}</span>
      {scoreLabel}
    </div>
  );
}
