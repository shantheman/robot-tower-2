# Robot Tower Survival v2 — notes for Claude Code

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
- **The game is named "ROBOT TOWER" / "Robot Tower Survival"** — decided by
  Shannon 2026-06-11. Design mocks that say "Core Defender" are placeholders;
  don't re-raise the rename unless he does.
- **Currency is coins, never dollars** — no `$` in any user-visible text.
  Money = gold coin icon; Cores = cyan diamond. Always pair value with icon.
- State colors are reserved: green = owned/equipped, cyan = available,
  dim = locked/unaffordable. Never use them decoratively. No magenta/pink.
- Fonts are bundled (Chakra Petch = HUD/numbers/labels, Space Grotesk = body);
  never system fonts.
- Pure game math lives in `src/sim/` (no Phaser/DOM imports) so it stays
  unit-testable; `tests/` mirrors the original repo's smoke-test assertions.
- The turret rig pivots are load-bearing: gun pivot (50%, 79%), base socket
  (50%, 43%) — see HANDOFF.md "Turret rig".

## Visual testing rule (from Shannon, 2026-06-11)
Any visual change gets verified at ALL THREE ratios before shipping: desktop
(~1280x900), phone landscape (~812x375), and phone portrait (~375x812 — note
portrait boots a different world size). Use preview_resize + screenshots.

## Commands
- `npm run dev` — Vite dev server (the game is playable in a browser).
- `npm test` — vitest parity tests. `npm run build` — typecheck + bundle.
- CI runs test + build on every push.

## Versioning
Same scheme as the original repo once releases start: bump version, add a
CHANGELOG entry, tag. (Pre-1.0 of the port: not yet enforced.)
