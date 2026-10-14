# iMessage extension plan

Goal: play Knucklebones inside Messages the way GamePigeon games work. Each turn is a
message bubble; tapping it opens the board, you place your die, and the same bubble
updates for your friend.

This document is a plan. Nothing in it has been built or verified yet, and none of it can
be compiled on the Windows machine this project is developed on. iOS app extensions need
Xcode or a cloud macOS builder, and Expo Go cannot run extensions.

## What has to be true first

- An Apple Developer Program membership, for signing and TestFlight.
- An Expo account and `eas-cli`, so EAS Build compiles the iOS app on Apple hardware.
- The `apps/mobile` Expo app with a real `ios.bundleIdentifier` in `app.json`. The current
  value `com.knucklebones.app` is a placeholder.

## Shape of the solution

The web app already defines the whole contract: a game is a share code (see
`packages/engine/src/codec.ts`) and a link is `https://<host>/#/g/<code>`. The extension
reuses both.

1. **Message payload.** Each bubble is an `MSMessage` whose `url` is that exact web link.
   Friends without the extension, or on Android or Mac, tap the bubble and land in the web
   game with the same state. That is why the link, not a custom scheme, is canonical.
2. **One bubble per game.** Every message in a game is created on the same `MSSession`, so
   Messages replaces the previous bubble instead of stacking a new one per turn.
3. **Reading state.** In `willBecomeActive(with conversation:)`, read
   `conversation.selectedMessage?.url`, pull the code out of the fragment, and decode it.
   If `selectedMessage.senderParticipantIdentifier == conversation.localParticipantIdentifier`
   the local user moved last and sees the waiting view.
4. **Making a move.** Place the die with the Swift engine, encode the new code, build an
   `MSMessage` on the existing session with an `MSMessageTemplateLayout` whose image is a
   rendered snapshot of the boards and whose caption reads something like
   `Turn 7 · You 23 · Them 18`, set `summaryText` for the notification, then
   `conversation.insert(message)` and `requestPresentationStyle(.compact)`.

## Code layout

```
apps/mobile/
  app.json                              plugins: ["@bacons/apple-targets"]
  targets/messages/
    expo-target.config.js               { type: 'imessage', name: 'Knucklebones', ... }
    MessagesViewController.swift        MSMessagesAppViewController hosting SwiftUI
    GameView.swift                      SwiftUI boards, dice drawn with shapes
    Engine.swift                        ~150 lines: rules, scoring, attack, codec
    Assets.xcassets/                    extension icon set
```

### Engine port

The Swift engine mirrors `packages/engine` one to one and must round-trip the same codes:

- `scoreColumn`: for each distinct value `v` appearing `n` times, add `v * n * n`.
- `place`: add the die to the first open slot, remove every die of that value from the
  opponent's same column and collapse the rest toward slot 0, end the game if either board
  is full, otherwise hand the turn over with the embedded next roll.
- Codec version `1`: `1 + id(4) + moves("A".."R", column * 6 + die - 1) + roll("0".."6")`
  with optional `,name0,name1` percent-encoded. Decode by replaying moves and reject
  anything that does not replay. Keep a shared fixture file of codes with their expected
  boards so the TypeScript and Swift suites assert the same table.

### Config plugin

`@bacons/apple-targets` (peer `expo >= 52`) adds native targets to the prebuilt Xcode
project. Its target registry includes `imessage`
(`com.apple.message-payload-provider`) even though the README's list omits it. Confirm at
implementation time by reading `node_modules/@bacons/apple-targets/build/target.js` and by
running `npx expo prebuild -p ios --no-install`, which works on Windows and shows the
generated project. If the type turns out to be missing, the fallback is a small custom
config plugin built on `@expo/config-plugins` `withXcodeProject`.

`targets/messages/expo-target.config.js`:

```js
module.exports = {
  type: 'imessage',
  name: 'Knucklebones',
  bundleIdentifier: '.messages',
  deploymentTarget: '16.0',
  frameworks: ['Messages', 'SwiftUI'],
};
```

`app.json` additions:

```json
{
  "plugins": [["@bacons/apple-targets", { "appleTeamId": "YOUR_TEAM_ID" }]],
  "extra": {
    "eas": {
      "build": {
        "experimental": {
          "ios": {
            "appExtensions": [
              { "targetName": "messages", "bundleIdentifier": "com.your.bundle.messages" }
            ]
          }
        }
      }
    }
  }
}
```

## Building and testing

```sh
npm i -g eas-cli
cd apps/mobile
eas login
eas build:configure
eas build -p ios --profile preview     # 10 to 20 minutes on EAS, installs via TestFlight or ad hoc
```

Each iteration is a cloud build, so get the Swift engine right against the shared fixture
first and keep the SwiftUI view simple. Test the full loop with two iPhones, or one iPhone
and the web app on a laptop, since the web link is what a recipient without the extension
sees.

## Open questions

- Whether the Messages extension memory limit tolerates `ImageRenderer` snapshots at the
  size we want for the bubble, or whether a smaller pre-rendered template is needed.
- How names flow in. Messages knows participants, so the extension could skip the name
  prompt and write the local contact name into the code when a seat is empty.
- Whether to keep a tiny history inside the extension (last few codes per `MSSession`) so
  the stale-link logic from the web app can be mirrored.
