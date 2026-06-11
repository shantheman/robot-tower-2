# Robot Tower Survival v2

The cross-platform rewrite of [Robot Tower Survival](https://github.com/TheDemonicChild/robot-tower-survival)
— Callum's tower-defense game — in **TypeScript + Phaser 3**, with all UI as
real HTML/CSS. Targets: **browser** (always, during development), then
**iOS / Android** via Capacitor and **macOS / Windows** desktop builds.

## Run it

```sh
npm install
npm run dev      # open the printed URL — the game runs in your browser
```

`npm test` runs the parity tests (the port's math must match the original
game); `npm run build` typechecks and bundles.

## What's here so far

- **Battle vertical slice**: the two-layer turret rig (static base + swiveling
  twin-barrel gun) with the real art, waves of enemies spawning on the original
  difficulty curve, hold-click shooting, kill rewards with the combo
  multiplier, contact damage, boss waves, and the cores-per-wave economy.
- **DOM HUD** per the design handoff: Level/Wave badges, Tower Integrity bar,
  coin + core counters, Skill Tree / Upgrades buttons, wave-intro countdown.
- `docs/SPEC-game-mechanics.md` — the ported balance bible (source of truth).
- `docs/design/` — the visual design handoff (mocks + sprites + brief).

## Not ported yet

Shop/upgrades panel, skill tree, ultimates, drone & auto-shooter, defense trio
(repair/plating/shield), home screen, settings, save/persistence, audio,
achievements, Capacitor/desktop packaging. The original repo remains the
playable reference for all of it.
