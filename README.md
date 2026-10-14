# Knucklebones

A playable version of the Knucklebones dice minigame, built as an npm-workspaces monorepo.

- `packages/engine` – pure TypeScript rules, scoring, CPU opponent and the share-link codec.
- `apps/web` – phone-first web game (Vite + React). Play the CPU, pass-and-play, or send
  a link to a friend and take turns at your own pace.
- `apps/mobile` – Expo app for iPhone (skeleton).

## Rules

- Each player has a 3x3 board. On your turn, roll a die and drop it into one of your columns.
- A column scores the sum of its dice, but matching dice multiply: a value appearing `n` times
  in a column scores `value * n * n`. Two 4s are 16, three 4s are 36.
- Placing a die removes every die of the same value from your opponent's facing column.
- The game ends the moment either board is full. Highest total wins.

## Development

```sh
npm install
npm test
npm run dev:web
```
