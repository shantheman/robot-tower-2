# Core Defender — Master TODO

A running checklist for the rewrite. **Anyone (Callum, Dad, Claude Code) can
add to this** — drop a `- [ ]` line in the right section. Check things off as
they land; prune completed items periodically (history lives in CHANGELOG.md
and git).

---

## Gameplay & content

- [ ] **Wingman** — the second drone (capstone of the Drone branch, ~300
      cores / ~400 coins). Picked in the drone brainstorm; needs the drone
      code refactored from a single sprite to a list.
- [ ] **Target Painter** — drone marks its target; marked enemies take +20%
      damage from all sources. Parked from the same brainstorm; needs a
      clear marked-enemy indicator to read well.
- [ ] **Enemy legend** — the original had a K-key overlay explaining enemy
      types. Never ported; mobile needs a tap-friendly equivalent (maybe a
      panel inside the shop or an info button on the wave intro).
- [ ] **Second Wind** — pay cores to revive in place, once per run. Parked
      from the death-penalty redesign; adds a cores sink once the tree is
      bought out. Revisit after checkpoint feel is validated.
- [ ] **Background music** — SFX exist (Web Audio synth); music never has.
      Decide: synthesized loop vs. licensed track.
- [ ] **Later levels + is there an end?** — carried from v1, still open.
      What do levels 8+ introduce (new enemies? modifiers?), and is there a
      win condition or is it endless?
- [ ] **Difficulty / balance pass with real playtest data** — ultimate
      pricing (250/400/500/1000 coins), shooter spawn weights vs. the new
      Interceptor, Medic heal rate, checkpoint spacing. Tune after Callum
      and friends have real hours in.
- [ ] **Haptics** — buzz on tower hit / ultimate fire / wave clear. Comes
      free with the Capacitor wrap (Haptics plugin); not available in
      browser on iOS.

## Art & assets

- [x] **Auto-Shooter icon** — DONE (2026-06-11): Shannon's auto-target art,
      shipped as `art/16_auto_shooter.webp`.
- [x] **Interceptor + Field Medic icons** — DONE (2026-06-11): shipped as
      `art/17_interceptor.webp` / `art/18_field_medic.webp`.
- [x] **Currency art** — DONE (2026-06-11): crystal core + gold coins
      (single inline, stack in corner displays) replace the CSS glyphs.
- [ ] **Replace the locked icon** — locked skill nodes and achievements
      currently show the generic 🔒 emoji (OS-rendered, so it looks like
      stock clip-art and varies per platform). Doesn't fit the design;
      swap for a custom SVG glyph or painterly art in the game's style.
      Sites: skill-tree locked nodes + legend (`src/ui/skills.ts`),
      achievements modal (`src/ui/achievements.ts`).
- [x] **More level backgrounds** — DONE (2026-06-12): 16 sets shipped, one
      per level of a full 15-level run. To add more: drop in
      public/backgrounds/ (pad at EXACT image center; a landscape-only set
      is fine — rotate 90° for the portrait variant) and append to
      LEVEL_BACKGROUNDS in src/config.ts.
- [ ] **Final enemy sprites** — the HANDOFF marks the current five as
      temporary ("likely replaced later, possibly animated"). Boss, Shooter,
      and the in-battle drone still use the old pygame-era art, which clashes
      with the new painterly style.
- [ ] **App icon** — favicon DONE (2026-06-11: the crystal core, plus an
      apple-touch-icon for iOS home screens). Still needed: proper app
      icon set for the PWA manifest and app stores (512px+, maskable).
- [ ] **Loading/splash screen** — first load shows a blank stage for a beat;
      a branded splash would cover asset load (also required for Capacitor).

## Code health

Rank-ordered (full audit 2026-06-12: refactoring + security). Verdict in
brief: the sim core is clean and tested, panels are consistent, security
posture is strong for a static no-backend game (no eval, no external
requests, fonts self-hosted, debug handles DEV-gated, saves type-coerced
on load). The items below are the gaps, most impactful first.

1. - [ ] **Split BattleScene** — now 785 lines (was ~650 when first
      flagged) and still growing with every feature: it owns combat, drone
      AI, shadows, juice, ultimates, and wave flow. Carve out `drone.ts`,
      `effects.ts` (zap/burst/popup/flash), and a shadow helper (the
      silhouette-shadow recipe is duplicated 3x: enemies, drone, tower).
      Wingman would make it ~900 lines — split BEFORE building Wingman.
2. - [ ] **Scripted E2E harness (Playwright)** — the headless QA pattern
      (drive `sys.step()`, freeze enemies, assert sim/screen state) gets
      rebuilt ad hoc in the preview console every session and the recipes
      keep being re-learned (dt clamp! unkillable-enemy trick! world vs
      screen coords!). Codify as Playwright tests so CI plays a level
      end-to-end. This is also the safety net the BattleScene split needs.
3. - [ ] **Upgrade vitest 2 -> 4** *(security)* — `npm audit`: 5 findings
      (1 critical) via vitest 2.1.9's nested vite 5/esbuild 0.21 copies.
      Test-time only (the shipped game and the dev server use the clean
      top-level vite 6.4.3), so real exposure is minimal — but it's audit
      noise that will mask a real finding someday. Likely a 10-minute bump
      (our 27 tests use nothing exotic).
4. - [ ] **Shadow/juice tunables -> config.ts** *(refactor)* — the values
      Shannon iterates on most are inline magic numbers: shadow offsets/
      alphas/scales (in 3 places), drone sprite scale (`* 2 * 1.76 * 0.8`),
      muzzle offsets (0.92/0.16), zap widths, popup timings. Hoist into
      config.ts next to their friends so a tuning pass is one-file.
5. - [ ] **innerHTML discipline** *(security hardening)* — panels build UI
      via template-string innerHTML. Today every interpolated value is a
      number or a static config string, so there's no XSS — but that's
      safety by convention, one careless save-field interpolation away
      from breaking (localStorage is attacker-writable via any XSS on the
      shared *.github.io origin). Add a tiny `esc()` helper + a comment
      rule: anything that ever touches storage gets escaped.
6. - [ ] **CI/Actions hardening** *(security)* — pin actions by commit SHA
      instead of `@v4` tags (supply-chain), and add explicit
      `permissions: contents: read` to ci.yml (it currently inherits the
      default token scope; deploy.yml already declares least privilege).
7. - [ ] **Panel base class** *(refactor)* — the root-div + register +
      hidden-class + render pattern is copy-pasted across 5 panels, and
      the scroll-preservation logic now lives in 2 of them. A small
      `Panel` base would also give new screens the right behavior free.
8. - [ ] **Orientation live-swap** — world size (960x720 vs 640x1280) is
      picked at boot; rotating mid-session letterboxes until reload.
      Decide: live re-world (restart battle on rotate?) or a "rotate
      back" hint.
9. - [ ] **Input routing consolidation** — keyboard shortcuts live in
      main.ts, Space lives in Phaser, buttons in each panel, and flow
      flags (shopMode, returnTo, justClearedLevel) are scattered. Fine
      today; consolidate if key rebinding or a new screen ever lands.
10. - [ ] **Housekeeping batch** *(small, do together)* — sync
      package.json version (stuck at 0.1.0 vs GAME_VERSION 0.7.1, single-
      source it); prune dead CSS (`.foot-hint` is orphaned post-footer-
      redesign — do a fuller sweep); consider a CSP `<meta>` tag (Pages
      can't send headers; a meta CSP still narrows XSS blast radius);
      document that the save key stays `rts2_save` forever (renaming
      wipes everyone — if ever needed, dual-read migration).
- [x] **Gate the debug handles** — DONE (2026-06-11, with the Pages
      deploy): `window.rt2` / `window.rt2scene` are `import.meta.env.DEV`
      only.

## Launch readiness

- [x] **Deploy the web build** — DONE (2026-06-11): GitHub Pages, auto-deploys
      from main on every push (tests must pass first). Live at
      https://shantheman.github.io/core-defender/
- [ ] **PWA pass** — manifest + icons + service worker: installable to the
      home screen, runs offline, fullscreen standalone on iOS. Cheap, and a
      real alternative to app stores for the friend-circle audience.
- [ ] **Capacitor wrap (iOS/Android)** — the real-app path: haptics, app
      icon, splash, store listing. Needs the Apple/Google developer accounts
      (decision + cost: $99/yr + $25 once).
- [ ] **Desktop packaging decision** — Tauri/Electron, or is "it runs in any
      browser" enough for desktop? (Leaning: browser is enough until proven
      otherwise.)
- [ ] **Save sync/export decision** — saves are per-browser localStorage;
      phone and desktop don't share progress. Options: ignore (fine for
      now), manual export/import code, or cloud saves (big scope).
- [ ] **Crash safety net** — v1 had a crash-log + friendly dialog; v2 has
      nothing. Add window.onerror → log + "something broke, reload?" toast.
- [ ] **Performance pass on older phones** — tested on Shannon's recent
      iPhone only. Check an older device + Android; watch particle counts on
      late waves.
- [ ] **Browser-compat sweep** — developed against Safari/Chrome; give
      Firefox and Android Chrome one full playthrough.
- [ ] **LICENSE + asset provenance** — carried from v1, still unresolved:
      no LICENSE file; confirm the AI-generated art/sprites are cleared for
      whatever distribution ends up happening.
- [ ] **ToS / Privacy Policy** — carried from v1: nothing collected today
      (keep it that way); app stores will require links. Revisit at
      Capacitor time.
- [ ] **Analytics/crash-reporting decision** — same stance as v1: nothing
      until there's a real reason, COPPA-gated, opt-in only.

## Decisions needed (Shannon/Callum)

- [ ] Is the original pygame repo now frozen? (v2 has diverged: level cap,
      checkpoints, cores bounties, new drone nodes, explosive buff.) If so,
      mark its README as superseded and point here.
- [ ] Onboarding: is a tutorial needed, or is the friend-circle audience
      fine learning by dying? (v1 carried this question too.)
- [ ] Accessibility beyond reduce-motion: colorblind-safe palette and text
      scaling — worth it pre-launch or post?
