# Changelog

Newest at top. The running version shows in Settings.

## v0.7.5 — 2026-06-12

- **Enemies enter from the true screen edges now.** The arena was a fixed
  4:3 box letterboxed onto wider screens, so on desktop enemies appeared
  to spawn well inside the playfield (the dead space showed background).
  The world now matches your window's shape, filling it edge to edge —
  the tower stays the same on-screen size, the arena just gets as wide
  (or tall) as your screen. Worst-affected was desktop; phones improve too.

## v0.7.4 — 2026-06-12

Balance: **Repair and Plating are once per level now** (Shannon's call —
stacked, they made the tower effectively unkillable, especially with
mid-wave panic-buys through the pause shop). Spent cards show "✓ USED"
until the next level. The caps are config knobs (REPAIR_MAX_BUYS /
PLATING_MAX_BUYS) if playtests say once is too strict.

## v0.7.3 — 2026-06-12

- **Transfer your save**: Settings → Transfer save. EXPORT copies a save
  code; IMPORT loads one (with a SURE? confirm — it replaces the current
  progress). Carry progress between phone and desktop, and across the
  upcoming domain move.
- **Crash safety net**: if the game ever breaks, a friendly banner with a
  RELOAD button appears (progress is saved) instead of a silent freeze.

## v0.7.2 — 2026-06-12

The code-health pass (player-visible bits listed; the rest is internal):

- **Rotating your phone now sorts itself out**: flip orientation and the
  game re-fits at the next safe moment — instantly on the Home screen,
  otherwise when you next return there (mid-battle stays playable
  letterboxed until then).
- Under the hood: BattleScene split into focused modules (drone, effects,
  shadows), a Playwright end-to-end suite that plays the game in CI,
  vitest 4 (audit clean), SHA-pinned CI actions, a production Content-
  Security-Policy, HTML-escaping discipline, and assorted housekeeping.

## v0.7.1 — 2026-06-12

Shadow realism pass (Shannon's review of v0.7.0) + 14 more battlefields:

- **Shadows are silhouettes now**: every unit casts its own shape, tinted
  black — a top-down view demands it (the old soft ellipse read like the
  unit was standing on its side). Shadows rotate with their owner.
- **Light from the top-left**: all shadows fall down-right, consistently.
  Land units show a visible rim past their feet; flyers stay detached.
- **The tower casts shadows too**: a grounded rim under the base, and the
  swiveling gun throws its silhouette onto the base as you aim.
- **Backgrounds 3–16**: a full 15-level run never repeats a battlefield.
  Sets 6+ are landscape-only; their portrait variant is a 90° rotation
  (radial compositions make this safe).
- **Home knows why you're there**: clearing a level now greets you with
  "LEVEL N COMPLETE — CORES BANKED" and a NEXT LEVEL button instead of
  "welcome back, defender".

## v0.7.0 — 2026-06-12

The battlefield gets real ground under it:

- **Level backgrounds** (Shannon's art drop): the metal launch deck and the
  cracked crater, alternating per level — more on the way; the list in
  config.ts just grows. The pad in the art sits exactly under the tower at
  any window size or orientation (center-aligned by construction), with a
  dedicated portrait variant for phones.
- **Enemy drop shadows**: land robots (grunt, tough, tank, boss) cast a
  tight dark shadow at their feet; flyers (quadcopter, bombers, the shooter
  pod) cast a smaller, fainter one offset well below — the gap reads as
  altitude. The player's drone got one too, so it isn't the only thing
  flying shadowless.
- The CSS grid floor retires during battles — the art is the floor now.

## v0.6.2 — 2026-06-11

- **Floating footer on Upgrades + Skill Tree** (new mocks): the big CTA and
  your balance (coins in the store, cores in the tree) now ride a pinned
  bar at the bottom of the screen instead of hiding below the fold on
  phones. Applied on desktop too — same bar, same reason, shorter windows.
- The currency readout moved out of the panel headers into that bar.

## v0.6.1 — 2026-06-11

- **Favicon**: the crystal core in the browser tab, plus an apple-touch-icon
  (navy-backed) for iOS home screens.
- **Save durability, pinned by tests**: updates never wipe progress — the
  loader fills missing fields with defaults, ignores unknown fields, and
  shrugs off corrupt saves. (Deploys never could touch localStorage; now a
  schema change can't either.)

## v0.6.0 — 2026-06-11

Shannon's art drop — the last text-only corners get real paint:

- **Auto-Shooter** finally has its own icon (a proper tower-mounted
  auto-turret), and **Interceptor** + **Field Medic** ship with their
  quadcopter art in both the store and the skill tree.
- **Currency went painterly**: the gold coin (single on every price chip,
  a coin *stack* in the corner money displays) and the crystal **core**
  replace the old CSS circle/diamond everywhere — battle HUD, store,
  skill tree, home, and achievement bounties.
- The game's new address: **https://shantheman.github.io/core-defender/**
  (repo renamed to match the new name; the old URL is retired).

## v0.5.1 — 2026-06-11

- **The game is now CORE DEFENDER** — Callum picked the name from the design
  mocks over the working title "Robot Tower". Home screen, browser tab, and
  all docs updated. Saves are untouched (the storage key is internal).

## v0.5.0 — 2026-06-11

Two new Drone skills (the branch grows to 4 nodes, tree total 1,880 cores):

- **Interceptor** (200 cores, then 250 coins/run): the drone shoots down
  enemy projectiles that enter its range — one swat every 0.35s, with a
  zap + spark so you see every save. The shooter counter.
- **Field Medic** (250 cores, then 300 coins/run): whenever the drone has
  no enemy in firing range — flying, repositioning, or a clear field — it
  repairs the tower at 2 HP/s with a green tether pulse. Offense or
  sustain: the drone now has a job every second of the wave.

## v0.4.1 — 2026-06-11

- **Twin Targeting now follows the rules**: unlock it in the tree, then buy it
  in-battle (200 coins, once per run) like every other tree power. It was the
  only node that auto-granted — an inconsistency inherited from the original.
- Auto-Shooter recategorized under CANNON (it's the tower's auto-turret, not
  a drone) and untangled from the quadcopter art.

## v0.4.0 — 2026-06-11

The art update (Claude Design icon drop, docs/design/ICONS-AND-PANELS-SPEC.md):

- **Upgrades store**: every card now carries its painterly icon, bleeding in
  from the right edge under a legibility scrim — merchandising-style. Grids
  fixed at 5 / 4 / 2 columns (desktop / landscape / portrait). Unaffordable
  cards desaturate their art.
- **Skill tree**: compact 46px icon tiles on every node (deliberately smaller
  than the store — the tree is a map, the store is a shelf).
- 15 icons shipped as webp (95KB total, converted from the 240px PNG drop).

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
