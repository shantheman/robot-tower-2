# Core Defender — Master TODO

A running checklist for the rewrite. **Anyone (Callum, Dad, Claude Code) can
add to this** — drop a `- [ ]` line in the right section. Check things off as
they land; prune completed items periodically (history lives in CHANGELOG.md
and git).

---

## Gameplay & content

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

- [ ] **Replace the locked icon** — locked skill nodes and achievements
      currently show the generic 🔒 emoji (OS-rendered, so it looks like
      stock clip-art and varies per platform). Doesn't fit the design;
      swap for a custom SVG glyph or painterly art in the game's style.
      Sites: skill-tree locked nodes + legend (`src/ui/skills.ts`),
      achievements modal (`src/ui/achievements.ts`).
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

1. - [x] **Split BattleScene** — DONE (2026-06-12): drone.ts
      (DroneController: move/fire/intercept/medic), effects.ts (zap/burst/
      popup/flash + the fx layer), shadows.ts (silhouette helper), types.ts.
      BattleScene 785 -> 633 lines; behavior verified by both suites + a
      live drone exercise (move/fire/kills/medic 2 HP/s exact). — now 785 lines (was ~650 when first
      flagged) and still growing with every feature: it owns combat, drone
      AI, shadows, juice, ultimates, and wave flow. Carve out `drone.ts`,
      `effects.ts` (zap/burst/popup/flash), and a shadow helper (the
      silhouette-shadow recipe is duplicated 3x: enemies, drone, tower).
      Wingman would make it ~900 lines — split BEFORE building Wingman.
2. - [x] **Scripted E2E harness (Playwright)** — DONE (2026-06-12):
      e2e/game.spec.ts (4 flows: wave-clear->shop+cores, shop buy + next
      wave, skill unlock + persistence, death->retry), driving rules
      documented in the file; `npm run test:e2e`; e2e job in ci.yml. — the headless QA pattern
      (drive `sys.step()`, freeze enemies, assert sim/screen state) gets
      rebuilt ad hoc in the preview console every session and the recipes
      keep being re-learned (dt clamp! unkillable-enemy trick! world vs
      screen coords!). Codify as Playwright tests so CI plays a level
      end-to-end. This is also the safety net the BattleScene split needs.
3. - [x] **Upgrade vitest 2 -> 4** *(security)* — DONE (2026-06-12):
      vitest 4.1.8, npm audit clean. — `npm audit`: 5 findings
      (1 critical) via vitest 2.1.9's nested vite 5/esbuild 0.21 copies.
      Test-time only (the shipped game and the dev server use the clean
      top-level vite 6.4.3), so real exposure is minimal — but it's audit
      noise that will mask a real finding someday. Likely a 10-minute bump
      (our 27 tests use nothing exotic).
4. - [x] **Shadow/juice tunables -> config.ts** — DONE (2026-06-12):
      SHADOW / TOWER_SHADOW / DRONE_SPRITE_SCALE / MUZZLE_* in config. — the values
      Shannon iterates on most are inline magic numbers: shadow offsets/
      alphas/scales (in 3 places), drone sprite scale (`* 2 * 1.76 * 0.8`),
      muzzle offsets (0.92/0.16), zap widths, popup timings. Hoist into
      config.ts next to their friends so a tuning pass is one-file.
5. - [x] **innerHTML discipline** — DONE (2026-06-12): esc() in
      src/ui/html.ts, applied to all name/desc interpolations; rule in
      CLAUDE.md. *(security hardening)* — panels build UI
      via template-string innerHTML. Today every interpolated value is a
      number or a static config string, so there's no XSS — but that's
      safety by convention, one careless save-field interpolation away
      from breaking (localStorage is attacker-writable via any XSS on the
      shared *.github.io origin). Add a tiny `esc()` helper + a comment
      rule: anything that ever touches storage gets escaped.
6. - [x] **CI/Actions hardening** — DONE (2026-06-12): SHA-pinned
      actions + least-privilege permissions in both workflows. *(security)* — pin actions by commit SHA
      instead of `@v4` tags (supply-chain), and add explicit
      `permissions: contents: read` to ci.yml (it currently inherits the
      default token scope; deploy.yml already declares least privilege).
7. - [x] **Panel base class** — DONE (2026-06-12): src/ui/panel.ts
      owns register/show/hide + the setHtml scroll contract; shop, skills,
      home, dead, pause all extend it. *(refactor)* — the root-div + register +
      hidden-class + render pattern is copy-pasted across 5 panels, and
      the scroll-preservation logic now lives in 2 of them. A small
      `Panel` base would also give new screens the right behavior free.
8. - [x] **Orientation live-swap** — DONE (2026-06-12): rotation
      reloads to re-pick the world — instantly on Home (lossless: no run
      in flight), otherwise deferred until the player next lands on Home.
      Mid-battle stays letterboxed-but-playable until then. — world size (960x720 vs 640x1280) is
      picked at boot; rotating mid-session letterboxes until reload.
      Decide: live re-world (restart battle on rotate?) or a "rotate
      back" hint.
9. - [ ] **Input routing consolidation** *(deferred by design)* — keyboard shortcuts live in
      main.ts, Space lives in Phaser, buttons in each panel, and flow
      flags (shopMode, returnTo, justClearedLevel) are scattered. Fine
      today; consolidate if key rebinding or a new screen ever lands.
10. - [x] **Housekeeping batch** — MOSTLY DONE (2026-06-12): version
      single-sourced from package.json; dead CSS pruned (back-btn,
      cores-lbl, foot-hint); save-key note in state.ts + CLAUDE.md.
      CSP meta DONE too (2026-06-12): injected at deploy build only
      (vite plugin, GH_PAGES-gated); the ?reset script went external to
      satisfy script-src 'self'; full battle verified under the policy
      via `npm run preview:pages`. ALL DONE. — sync
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

- [ ] **PWA pass** — manifest + icons + service worker: installable to the
      home screen, runs offline, fullscreen standalone on iOS. Cheap, and a
      real alternative to app stores for the friend-circle audience.
- [ ] **Capacitor wrap (iOS/Android)** — the real-app path: haptics, app
      icon, splash, store listing. Publishing under **Bauman Games LLC**
      (Apple org account exists). Bundle ID: **com.baumangames.coredefender**
      (matches the com.baumangames.chimera convention).
- [ ] **Desktop packaging decision** — Tauri/Electron, or is "it runs in any
      browser" enough for desktop? (Leaning: browser is enough until proven
      otherwise.)
- [ ] **Save sync/export decision** — saves are per-browser localStorage;
      phone and desktop don't share progress. Options: ignore (fine for
      now), manual export/import code, or cloud saves (big scope).
- [ ] **Crash safety net** — v1 had a crash-log + friendly dialog; v2 has
      nothing. Add window.onerror → log + "something broke, reload?" toast.
      This is also the foundation for store crash reporting (below).
- [ ] **Performance pass on older phones** — tested on Shannon's recent
      iPhone only. Check an older device + Android; watch particle counts on
      late waves.
- [ ] **Browser-compat sweep** — developed against Safari/Chrome; give
      Firefox and Android Chrome one full playthrough.
- [ ] **LICENSE + asset provenance** — carried from v1, still unresolved:
      no LICENSE file; confirm the AI-generated art/sprites are cleared for
      whatever distribution ends up happening.
- [ ] **ToS / Privacy Policy** — Bauman Games already hosts both
      (baumangames.com/terms.html + /privacy.html); update them to cover
      Core Defender, including crash-data collection once that SDK lands.
- [ ] **Crash reporting** — DECIDED (2026-06-12): yes, before the Apple
      submission. Shannon leans Crashlytics; consider Sentry instead — in
      a Capacitor app most "crashes" are JS errors in the webview, which
      Sentry captures first-class without the Firebase/google-services
      setup. Crash data only, no analytics.

### Store submission checklist (Apple + Google Play)

Context decided 2026-06-12: publisher **Bauman Games LLC**, bundle ID
**com.baumangames.coredefender**, target audience **13+** (avoids kids/
Families policy), ToS + Privacy Policy live at baumangames.com.

**Legal / policy**
- [ ] Update baumangames.com terms.html + privacy.html to list Core
      Defender and disclose crash-data collection (crash SDK, when added).
- [ ] Update baumangames.com marketing pages to include Core Defender.
- [ ] Apple "App Privacy" nutrition label: declare diagnostics/crash data,
      not linked to identity, not used for tracking (no ATT needed).
- [ ] Google Play Data Safety form: same declaration.
- [ ] Age-rating questionnaires (Apple + IARC): cartoon violence, ~9+/E10
      content rating; declared target audience 13+ on Play.
- [ ] EU DSA trader declaration (both stores; the LLC likely declares as
      trader — confirm what chimera did).
- [ ] Asset provenance comfort check (AI art) before the content-rights
      attestations — ties to the LICENSE item above.

**Accounts / process**
- [ ] Google Play account: confirm whether an LLC org account exists (org
      accounts skip the personal-account rule of 12 testers x 14 days,
      but require a D-U-N-S number — the LLC has one if Apple org
      enrollment is done).
- [ ] Reserve the "Core Defender" name in App Store Connect early (name
      collisions are common).
- [ ] Android signing: enroll in Play App Signing (Google keeps the key).
- [ ] TestFlight internal -> friend-circle external test before release;
      Play internal testing track likewise.

**Store assets** (Claude-Design batch)
- [ ] App icon: 1024px (Apple) + Android adaptive (fg/bg layers, maskable)
      — same art unblocks the PWA manifest item.
- [ ] Screenshots: iPhone 6.7"/6.5"/5.5" (+ iPad if enabled), Android
      phone + 7"/10" tablet, Play feature graphic 1024x500.
- [ ] Splash screen (required by Capacitor anyway — see Art section).
- [ ] Listing copy: short + full descriptions, Apple keywords, support URL
      (baumangames.com or the Pages site), contact email.

**Technical**
- [ ] Capacitor config: bundle ID, versionName/versionCode sync with
      GAME_VERSION, min/target OS (Play ratchets target API yearly).
- [ ] Apple export compliance: ITSAppUsesNonExemptEncryption=NO
      (HTTPS-only).
- [ ] Apple 4.2 minimum-functionality pass: fully offline, no browser
      chrome, haptics wired (games in Capacitor pass routinely; haptics
      strengthens it).
- [ ] Decide store-release cadence (web updates every push; store builds
      are snapshots).

## Decisions needed (Shannon/Callum)

- [ ] Is the original pygame repo now frozen? (v2 has diverged: level cap,
      checkpoints, cores bounties, new drone nodes, explosive buff.) If so,
      mark its README as superseded and point here. Shannon Note:  YES - it is frozen.  Do as you suggested.
- [ ] Onboarding: is a tutorial needed, or is the friend-circle audience
      fine learning by dying? (v1 carried this question too.)
- [ ] Accessibility beyond reduce-motion: colorblind-safe palette and text
      scaling — worth it pre-launch or post? 
