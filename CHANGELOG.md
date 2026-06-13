# Changelog

Newest at top. The running version shows in Settings.

## v0.8.26 — 2026-06-12

- **Boss-fire sound effect.** The boss now plays an impact sound each time it
  fires at the tower. Added a small file-based SFX system: clips are fetched +
  decoded into the same Web Audio pool as the synth sounds, so they share the
  **Sound** volume gate and the autoplay unlock — and stay low-latency and
  overlappable. Adding more SFX is now a one-line entry in `FILE_SFX`.

## v0.8.25 — 2026-06-12

- **Background music.** A looping soundtrack plays across the whole game
  (streamed MP3, ~3.5 MB, converted from the source WAV). Settings now has two
  independent sliders — **Sound** (the synth SFX) and **Music** — each with
  **0 = off**, and both persist in the save. Music starts on the first
  tap/click (browser autoplay policy) and pauses when the tab is hidden.

## v0.8.24 — 2026-06-12

- **The game is now MECH TIDE** — Callum's pick (renamed from "Core Defender").
  The name was conflict-checked across Steam, the Apple App Store, and Google
  Play before committing. Home screen, browser tab, repo, and the live URL all
  updated; the repo/Pages address moves to
  **https://shantheman.github.io/mech-tide/** (the old `/core-defender/` URL
  retires). Saves are untouched — the storage key is internal and frozen.

## v0.8.23 — 2026-06-12

- **Hid the Animation Playground link** from Settings. The playground page is
  still built and live at `/playground.html` (direct URL) — just no longer
  surfaced in-game.

## v0.8.22 — 2026-06-12

- **Grunt dish pivot corrected** to Shannon's marked spot: pivot `0.545,0.475`
  → `0.506,0.464` (detected from the blue-dot reference, pixel-identical
  framing to the texture). The dish now swivels about its true mount.

## v0.8.21 — 2026-06-12

- **Size tweaks:** Tank 20% smaller (radius 34.6 → 27.68), Boss 20% bigger
  (radius 40 → 48). Radius is also the hitbox, so it scales with each.

## v0.8.20 — 2026-06-12

- **Boss faces the right way + fires from its turret.** The boss art was
  approaching backwards (guns pointing away from the tower) — rotated the
  sprite 180°. Its covering fire now spawns from the central turret muzzle
  (forward of center toward the tower, `BOSS_FIRE.muzzleForward`) instead of
  the sprite's center.

## v0.8.19 — 2026-06-12

- **New Boss art** (a hulking mech) and **boss covering fire.** The boss now
  lobs projectiles at the tower as it advances (on top of its melee crash),
  scaling with the game level: at level 1 just a shot or two of chip damage
  over its slow trek, ramping to a faster, harder barrage later. Cooldown
  `max(0.9, 6.0 − 0.7·(level−1))` s, damage `4 + 4·(level−1)` (`BOSS_FIRE`).
  The drone's interceptor can swat these like any enemy round.

## v0.8.18 — 2026-06-12

- **Tank is 33% bigger** (radius 26 → 34.6) and re-tuned: sits lower and stops
  wobbling (`tank: { altitude: -12 }`). As with the other size bumps, radius is
  also the hitbox, so it scales too.

## v0.8.17 — 2026-06-12

- **New Tank enemy art** (enemy_2, Shannon's drop) — armored hull with a glowing
  reactor core. Same 1px export frame stripped as the earlier drops.

## v0.8.16 — 2026-06-12

- **Playground export now keeps `hexSnap`** (dev tool): structural fields that
  have no slider (currently just the shooter's `hexSnap: 6`) are carried
  straight from config into the Copy-config output, so pasting a full
  ENEMY_ANIM block round-trips without silently dropping them.

## v0.8.15 — 2026-06-12

- **Tough now hovers** (Shannon's tune): altitude 0.5, a 10px hover bob at
  2.2 Hz — it floats and casts a fading detached shadow instead of sitting
  flat. Other enemies' anim values unchanged.

## v0.8.14 — 2026-06-12

- **Grunt, Tough, and Fast are 50% bigger.** Bumped their hit radius ×1.5
  (grunt 14→21, fast 10→15, tough 15→22.5), which scales the sprite, shadow,
  and grunt dish proportionally. Note: radius is also the hitbox, so they're
  correspondingly easier to hit and reach the tower a hair sooner — shout if
  you want the visual decoupled from the hitbox.

## v0.8.13 — 2026-06-12

- **Grunt dish casts a drop shadow.** Like the tower gun's, the radar dish now
  throws a soft black silhouette onto the body — dropped down-right, swiveling
  with the dish, drawn in the gap between dish and base — so it reads as
  sitting above the hull. Tunable per enemy (`shadowAlpha`, `shadowDrop`).
- **New Tough enemy art** (enemy_3, Shannon's drop).
- **Cleaned a 1px export frame** off the new grunt + tough sprites (a faint
  semi-transparent border ring the art shipped with); sub-pixel at game size,
  but now they're clean cutouts.

## v0.8.12 — 2026-06-12

- **Grunt is a radar tank now.** New two-part art (Shannon's drop): a tank
  body plus a satellite dish that mounts on the body's central plate and
  swivels on its own — it rotates to a random heading, holds for a beat, then
  re-aims, continuously. The dish pivots about its mount (origin pinned to the
  clamp at 0.545, 0.475 of the shared canvas) and rides the body as it turns to
  face the tower. Generic: any enemy can now declare a `satellite` overlay in
  config. Honors reduce-motion (dish freezes, still seated). Previewable and
  tunable in the Animation Playground.

## v0.8.11 — 2026-06-12

- **Explosion grey-square artifact fixed (for real).** v0.8.9/v0.8.10 chased
  the wrong causes (breathe, canvas corners, smoke); the true culprit was the
  particle *textures* themselves. The soft radial gradients had non-zero RGB at
  their zero-alpha outer stop, so the additive pipeline summed that dark colour
  across each full texture quad — invisible per particle, but at frame 0 when a
  dozen particles stack on one point the fringes piled into a visible grey
  square. Rebuilt `burst()` entirely from tweened solid circles (no canvas
  textures, no particle emitters): a flash, shockwave ring, fireball chunks,
  and sparks, all additive. Geometry has no quad and no fringe, so the artifact
  is structurally impossible now.
- **Bomber squadron no longer freezes solid-white on death.** The hit-flash
  tint is now cleared the instant a formation dies, so the planes explode in
  their own colours through the cascade instead of sitting white for ~0.5 s
  (once dead they leave the update loop that would otherwise clear the tint).

## v0.8.10 — 2026-06-12

- **Explosion black-square artifact fixed.** Particle canvas textures
  were drawn with `fillRect`, which painted the full rectangle including
  corners outside the radial gradient — those pixels rendered as opaque
  black in WebGL. Switched to `arc()` + `fill()` so only the circular
  gradient region is ever painted; corners stay transparent.

## v0.8.9 — 2026-06-12

- **Animation retune + breathe removed.** All enemies updated to
  Shannon's final ENEMY_ANIM values (altitude-based positioning, revised
  bob/wobble per enemy). The breathe scale-pulse feature is removed —
  `breatheAmp`/`breatheHz` stripped from the interface, runtime, and
  playground sliders.

## v0.8.8 — 2026-06-12

- **Shooter rotation aligned.** Hex-snap faces were offset by 30°, so
  the shooter was firing from between its weapon ports. Added a π/6
  half-step to every snap target so a weapon port always faces the tower.

## v0.8.7 — 2026-06-12

- **Bomber squadron: full hitbox + cascade explosion.** All 6 planes
  are now valid bullet targets (previously only the leader counted).
  They share a single HP pool, so any hit damages the formation. On
  kill, whichever plane took the killing shot explodes first; the other
  five chain-react nearest-to-farthest in 80 ms steps — six rapid
  fireballs rippling through the formation.

## v0.8.6 — 2026-06-12

- **Shooter rotates like it has a brain.** The hexagonal shooter pod now
  snaps to its 6 discrete faces instead of smoothly tracking the tower.
  While flying in it idles through random face changes (1–2 s per side);
  once it's in firing position it rotates to a fresh random face just before
  each shot — a subtle pre-shot tell. All other enemies are unaffected.

## v0.8.5 — 2026-06-12

- **Particle explosions.** `burst()` now uses Phaser's particle emitter system
  with three soft radial-gradient textures generated at runtime (no new assets):
  fire (additive blend — glows orange against dark backgrounds), smoke (expands
  as it drifts upward), and sparks (fast outward, additive). The flash and
  shockwave ring are kept as crisp geometry. Looks like a real game explosion.

- **Bomber fixes.** Planes scaled down (radius 10 → was 16), formation offsets
  tightened. Each wing plane now casts its own shadow, forming a mini V-shadow
  below the main formation.

## v0.8.4 — 2026-06-12

- **Bomber is now a squadron.** enemy_4 replaced with a sleek top-down
  fighter jet (bomber-v2.png); six copies fly in a tight V-formation toward
  the tower. Each wing plane drifts independently (per-plane sine phase) while
  the group bobs and wobbles as one unit — giving a living, undulating swarm
  feel without any extra assets.

## v0.7.8 — 2026-06-12

- **Animation Playground** (dev tool, Settings → Animation playground): a
  standalone page to view each enemy in its states (idle / moving / firing /
  explode) and tune the procedural-animation values live, then copy them
  into config. Uses the exact same animation code as the game, so what you
  tune is what you get. Harmless if the link leaks.

## v0.7.7 — 2026-06-12

- **Enemies feel alive (procedural animation, prototype).** No new art — the
  existing sprites now breathe (idle scale pulse), flyers hover with a
  bobbing float and a fading ground shadow, twitchy units wobble, and the
  shooter swells as it charges a shot (a readable telegraph). All tunable
  per enemy in config; freeze pauses it and slow-mo slows it. Honors the
  Reduce-motion setting (those players keep static enemies).

## v0.7.6 — 2026-06-12

- **Resizing the window re-fits the arena.** The playfield was sized once at
  load; now any shape change — a desktop window resize as well as a phone
  rotation — re-fits the arena to fill the new screen. It applies at the
  next Home screen (every level ends there), so an in-progress run is never
  interrupted or lost. Phones still only react to real rotations, not the
  address-bar showing/hiding.

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
