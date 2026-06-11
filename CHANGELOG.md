# Changelog

Newest at top. The running version shows in Settings.

## v0.2.0 — 2026-06-11

Death shouldn't erase 14 waves of fun:

- **Levels cap at 15 waves** (the original grew forever; level 10 was 50).
- **Mid-level checkpoints every 5 waves**: entering wave 6/11 snapshots your
  full loadout — coins, upgrades, drone, ultimates. Dying offers RETRY FROM
  WAVE N: the snapshot restored at full HP. Replayed waves never re-pay cores.
- Plus this morning's batch: virtual-joystick touch aiming, tap-to-fire
  ultimate (bottom-center), touch-aware hints, iOS silent-switch audio fix,
  mobile home/death/shop layouts, settings gear in battle, level-up runaway
  fix, save reset (?reset + Settings).

## v0.1.0 — 2026-06-11

The overnight port: the complete game loop from the original Python v0.7.0,
rebuilt in TypeScript + Phaser 3 with all UI as real HTML/CSS per the design
handoff. Battle (all enemies/weapons/defenses/ultimates), the cores-per-wave
economy, shop, skill tree, home/death/pause/settings, versioned localStorage
saves, synthesized audio, 19 sim parity tests + wave-math tests, CI.
