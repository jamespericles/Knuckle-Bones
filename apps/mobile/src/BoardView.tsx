import { ALL_COLUMNS, countOf, isColumnFull, scoreColumn } from '@knucklebones/engine';
import type { Board, ColumnIndex, DieValue } from '@knucklebones/engine';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface BoardViewProps {
  readonly board: Board;
  readonly name: string;
  readonly score: number;
  /** The board across the table: header on top, dice growing downward. */
  readonly flipped: boolean;
  readonly active: boolean;
  readonly roll: DieValue | null;
  readonly onPlace?: ((column: ColumnIndex) => void) | undefined;
}

const SLOTS = [0, 1, 2] as const;

/** Unicode die faces, U+2680 is ⚀. */
export function dieGlyph(value: DieValue): string {
  return String.fromCodePoint(0x267f + value);
}

export function BoardView({ board, name, score, flipped, active, roll, onPlace }: BoardViewProps) {
  const slotOrder = flipped ? [...SLOTS] : [...SLOTS].reverse();
  return (
    <View style={[styles.board, !flipped && styles.boardMine, active && styles.boardActive]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={[styles.score, active && styles.scoreActive]}>{score}</Text>
      </View>
      <View style={styles.columns}>
        {ALL_COLUMNS.map(index => {
          const column = board[index];
          const enabled = onPlace !== undefined && roll !== null && !isColumnFull(column);
          return (
            <Pressable
              key={index}
              disabled={!enabled}
              onPress={() => onPlace?.(index)}
              accessibilityRole="button"
              accessibilityLabel={`Column ${index + 1}, score ${scoreColumn(column)}`}
              style={[styles.column, flipped && styles.columnFlipped, enabled && styles.columnOpen]}
            >
              {slotOrder.map(slot => {
                const value = column[slot];
                return (
                  <View key={slot} style={[styles.slot, value === null && styles.slotEmpty]}>
                    {value !== null ? (
                      <Text style={[styles.die, countOf(column, value) > 1 && styles.dieMatched]}>
                        {dieGlyph(value)}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
              <Text style={styles.columnScore}>{scoreColumn(column)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#16131d',
    borderRadius: 20,
    padding: 12,
    gap: 8,
  },
  boardMine: {
    flexDirection: 'column-reverse',
  },
  boardActive: {
    borderWidth: 2,
    borderColor: 'rgba(216, 169, 74, 0.6)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: {
    color: '#ece4d2',
    fontSize: 20,
    fontWeight: '600',
  },
  score: {
    color: '#a99f8d',
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreActive: {
    color: '#d8a94a',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  column: {
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 12,
  },
  columnFlipped: {
    flexDirection: 'column-reverse',
  },
  columnOpen: {
    backgroundColor: 'rgba(216, 169, 74, 0.08)',
  },
  slot: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9dfc7',
  },
  slotEmpty: {
    backgroundColor: '#211c2b',
  },
  die: {
    fontSize: 44,
    lineHeight: 52,
    color: '#1a1218',
  },
  dieMatched: {
    color: '#b3122c',
  },
  columnScore: {
    color: '#a99f8d',
    fontSize: 16,
    fontWeight: '600',
  },
});
