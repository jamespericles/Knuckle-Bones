# Knucklebones

A playable version of the Knucklebones dice minigame, built as an npm-workspaces monorepo.

- `packages/engine` – pure TypeScript rules, scoring, CPU opponent and the share-link codec.
- `apps/web` – phone-first web game (Vite + React). Play the CPU, pass the phone, or send a
  link to a friend and take turns at your own pace.
- `apps/mobile` – Expo app for iPhone. A skeleton for now that renders the engine's board.
- `docs/imessage-extension.md` – plan for the native iMessage extension.

## Rules

- Each player has a 3x3 board. On your turn, roll a die and drop it into one of your columns.
- A column scores the sum of its dice, but matching dice multiply: a value appearing `n` times
  in a column scores `value * n * n`. Two 4s are 16, three 4s are 36.
- Placing a die removes every die of the same value from your opponent's facing column.
- The game ends the moment either board is full. Highest total wins.

## Playing with a friend

Pick "Play a friend by link" on the home screen. After each move the app offers a link that
carries the whole game, so send it over iMessage or anything else. Your friend opens it, sees
your move and their roll, plays, and sends a link back. Nothing is stored on a server; the
link is the game. Games you have opened are listed on the home screen so you can find the
latest link again.

The link format is documented in `packages/engine/src/codec.ts`. The same string will be the
payload of the iMessage extension later, so the two can play together.

## Development

Requires Node 24 (see `.node-version`).

```sh
npm install
npm run dev:web          # Vite dev server, also reachable from your phone on the same Wi-Fi
npm test                 # all workspaces, with 90% coverage thresholds
npm run typecheck
npm run lint
npm run format           # Prettier
npm run build:web        # static site in apps/web/dist
npm run dev:mobile       # Expo dev server; scan the QR code with the iPhone camera
```

The engine is consumed as TypeScript source through the workspace symlink, so edits there
hot-reload in both apps with no build step.

## Deploying the web game

`apps/web` builds with a relative base and hash routing, so the `dist` folder works on any
static host. The `Deploy web` workflow publishes it to GitHub Pages on every push to `master`.
Enable Pages in the repository settings with "GitHub Actions" as the source before the first
run.
