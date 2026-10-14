import { Die } from '../Die/Die';
import { Sheet } from './Sheet';

export interface RulesSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function RulesSheet({ open, onClose }: RulesSheetProps) {
  return (
    <Sheet open={open} title="How to play" onClose={onClose}>
      <ul className="rules__list">
        <li>You and your rival each have three columns of three slots.</li>
        <li>On your turn, roll a die and drop it into one of your columns.</li>
        <li>
          Matching dice in a column multiply. A value that appears twice counts double for each die,
          three times counts triple.
        </li>
        <li>
          Placing a die wipes every die of the same value from your rival&apos;s facing column.
        </li>
        <li>The game ends the moment either board is full. Highest total wins.</li>
      </ul>
      <div className="stack">
        <div className="rules__example">
          <div className="rules__dice">
            <Die value={4} size="sm" />
          </div>
          <span>One 4 scores 4.</span>
        </div>
        <div className="rules__example">
          <div className="rules__dice">
            <Die value={4} size="sm" matched />
            <Die value={4} size="sm" matched />
          </div>
          <span>Two 4s score 16.</span>
        </div>
        <div className="rules__example">
          <div className="rules__dice">
            <Die value={4} size="sm" matched />
            <Die value={4} size="sm" matched />
            <Die value={4} size="sm" matched />
          </div>
          <span>Three 4s score 36.</span>
        </div>
      </div>
    </Sheet>
  );
}
