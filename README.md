# Mech Tide

The cross-platform rewrite of [Robot Tower Survival](https://github.com/TheDemonicChild/robot-tower-survival)
— Callum's tower-defense game, renamed **Mech Tide** for v2 — in
**TypeScript + Phaser 3**, with all UI as real HTML/CSS. Targets: **browser** (always, during development), then
**iOS / Android** via Capacitor and **macOS / Windows** desktop builds.

**Play it now:** https://shantheman.github.io/mech-tide/ (auto-deploys
from main).

## Run it

```sh
npm install
npm run dev      # open the printed URL — the game runs in your browser
```

`npm test` runs the parity tests (the port's math must match the original
game); `npm run build` typechecks and bundles.

## What's here so far

The full game loop, ported 1:1 from the original (docs/SPEC-game-mechanics.md
is the contract; `tests/` pins the math):

- **Battle**: two-layer turret rig with the real art, all 7 enemy types
  (incl. ranged Shooters and per-level Bosses), the original difficulty
  curve, hold-click shooting with Multi-Shot / Piercing / Explosive
  (shockwave) / Guided rounds, Auto-Shooter, the Drone (orbit, hunt,
  Twin Targeting), instant kill bonuses, combo multiplier.
- **Defense**: Repair / Plating / the layered Shield (rings per layer,
  30 dmg soaked per layer, crash-on-ring, recharges each wave).
- **Ultimates**: EMP / Freeze / Time Warp / Laser — own many, equip one,
  Space fires, per-ultimate cooldowns.
- **Economy**: coins in-run; permanent Cores per cleared wave (+1 x level)
  with the boss-wave bonus (+15 x level). No coin->core conversion.
- **Screens** (all real HTML/CSS per the design handoff): battle HUD with
  status chips, between-waves Upgrades store, Skill Tree (4 branches,
  12 nodes), Home (new/returning), You-Died with cores count-up, pause,
  settings (sound, volume, reduce-motion, fullscreen).
- **Saves** in localStorage (versioned), synthesized **audio** (Web Audio
  port of the original's tone recipes), focus-loss auto-pause.

The master checklist lives in [docs/TODO.md](docs/TODO.md).

## Not yet ported / next up

Achievements UI (the 12 achievements unlock and persist; no browsing modal
yet), the in-battle enemy legend, responsive portrait-phone HUD layouts,
Capacitor (iOS/Android) and desktop packaging, music. The original repo
remains the reference implementation.
