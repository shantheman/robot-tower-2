# Mech Tide (Robot Tower Survival v2) — notes for Claude Code

The cross-platform rewrite of [robot-tower-survival](https://github.com/TheDemonicChild/robot-tower-survival)
(Callum's original Python/pygame game, on disk at `~/Code/robot-tower-survival`).

**Stack:** TypeScript + Vite + Phaser 3 (battle scene) with a **DOM/CSS overlay
for ALL UI** (HUD, menus, shop, skill tree — real HTML, not canvas text).
Mobile via Capacitor and desktop packaging come after the gameplay port.

## The porting contract (read before changing anything)
1. **The original app is the source of truth for behavior and numbers.**
   `docs/SPEC-game-mechanics.md` (copied from the original repo) defines every
   enemy stat, weapon formula, wave curve, and cost. Port faithfully; balance
   changes are deliberate decisions, not porting drift.
2. **The design package is the source of truth for visuals.**
   `docs/design/HANDOFF.md` + the `.jsx` mocks define look, palette, spacing,
   and motion. Where a mock disagrees with the original app on anything that
   isn't pure visuals, **the original app wins** (e.g. the mock's death screen
   shows the old money→cores salvage; the real model is cores-per-wave).
3. Keep `docs/SPEC-game-mechanics.md` updated in the same commit as any
   gameplay-value change (same rule as the original repo).

## Conventions
- **The game is named "MECH TIDE"** — Callum's call, 2026-06-12 (renamed from
  "Core Defender", which had replaced the working title "Robot Tower"). The
  name was conflict-checked across Steam / App Store / Google Play before
  picking it. The original pygame game keeps its old name; only v2 is Mech Tide.
- **Health verbiage**: the label is "Tower Health" (never "Integrity");
  numeric stats use the unit "HP" ("+30 HP", "+25 max HP").
- **Currency is coins, never dollars** — no `$` in any user-visible text.
  Money = gold coin icon; Cores = cyan diamond. Always pair value with icon.
- State colors are reserved: green = owned/equipped, cyan = available,
  dim = locked/unaffordable. Never use them decoratively. No magenta/pink.
- Fonts are bundled (Chakra Petch = HUD/numbers/labels, Space Grotesk = body);
  never system fonts.
- Pure game math lives in `src/sim/` (no Phaser/DOM imports) so it stays
  unit-testable; `tests/` mirrors the original repo's smoke-test assertions.
- **innerHTML rule**: numbers and config-table strings may interpolate into
  panel templates; any string that has EVER passed through storage, a URL,
  or user input goes through `esc()` (src/ui/html.ts). Names/descriptions
  are wrapped today as the visible habit.
- The localStorage save key is `rts2_save` **forever** (predates the rename;
  changing it wipes every player — see the note in src/sim/state.ts).
- The turret rig pivots are load-bearing: gun pivot (50%, 86%), base socket
  (50%, 43%) — see HANDOFF.md "Turret rig". The swiveling gun art swaps with
  the per-shot bullet count (1 + multiLevel): `turret_gun_1/2/3/many.png`,
  all sharing dims + pivot (see `turretGunKey()` in config.ts). The old
  twin-barrel `turret_gun.png` (pivot 79%) survives only in the decorative
  HTML spots (home hero, shop thumb).

## Visual testing rule (from Shannon, 2026-06-11)
Any visual change gets verified at ALL THREE ratios before shipping: desktop
(~1280x900), phone landscape (~812x375), and phone portrait (~375x812 — note
portrait boots a different world size). Use preview_resize + screenshots.

## Backlog
`docs/TODO.md` is the master checklist (features / art / code health /
launch readiness). Keep it current: check off what lands, add what's found.

## Commands
- `npm run dev` — Vite dev server (the game is playable in a browser).
- `npm test` — vitest parity tests. `npm run build` — typecheck + bundle.
- CI runs test + build on every push.

## Versioning
package.json `version` is the single source (src/version.ts imports it; the
Settings footer shows it). Per meaningful change: bump package.json, add a
CHANGELOG entry, `git tag vX.Y.Z`, push with tags.
