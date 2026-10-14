import { createGame, legalColumns, placeDie, scores } from '@knucklebones/engine';
import type { ColumnIndex, GameState } from '@knucklebones/engine';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BoardView } from './src/BoardView';

/**
 * Skeleton pass-and-play screen proving the engine runs under Metro from the
 * workspace. The full mobile UI comes later.
 */
export default function App() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [scoreOne, scoreTwo] = scores(game);
  const playing = game.status === 'playing';

  const place = (column: ColumnIndex) => {
    if (!playing || !legalColumns(game.boards[game.current]).includes(column)) return;
    setGame(placeDie(game, column));
  };

  let headline: string;
  if (playing) headline = `Player ${game.current + 1}, you rolled a ${game.roll ?? ''}`;
  else if (game.winner === 'draw') headline = 'A draw';
  else headline = `Player ${(game.winner ?? 0) + 1} wins`;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.title}>Knucklebones</Text>
      <BoardView
        board={game.boards[1]}
        name="Player 2"
        score={scoreTwo}
        flipped
        active={playing && game.current === 1}
        roll={game.roll}
        onPlace={playing && game.current === 1 ? place : undefined}
      />
      <Text style={styles.headline}>{headline}</Text>
      <BoardView
        board={game.boards[0]}
        name="Player 1"
        score={scoreOne}
        flipped={false}
        active={playing && game.current === 0}
        roll={game.roll}
        onPlace={playing && game.current === 0 ? place : undefined}
      />
      <Pressable
        style={styles.button}
        onPress={() => setGame(createGame())}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>New game</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0a0f',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#ece4d2',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  headline: {
    color: '#ece4d2',
    fontSize: 17,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'center',
    backgroundColor: '#b3122c',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  buttonText: {
    color: '#ece4d2',
    fontSize: 18,
    fontWeight: '600',
  },
});
