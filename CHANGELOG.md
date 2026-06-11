# Changelog

Newest at top. The running version shows in Settings.

## v0.3.1 — 2026-06-11

Explosive Rounds actually explode now:

- Blast radius **100px base, +25 per level** (was a fixed 60 — too small for
  how spread out enemies are). Splash damage **16 base** (one-shots Fast),
  still +6 per level.
- Every splash victim shows an orange **damage number**, and the shop card
  lists the real splash/range numbers per level.

## v0.3.0 — 2026-06-11

Achievements get their windows back (the system always worked — silently):

- **Trophy button** in the Home top bar opens the achievements modal
  (two columns on desktop, single-column scroll on phones).
- **Unlock toasts in battle**: "Achievement: Boss Slayer! +10 cores" slides
  in top-center the moment it happens.
- **Cores bounties**: each achievement pays a one-time 10-25 cores
  (190 total across all 12) — a fun secondary goal that doesn't distort
  the wave economy.

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
