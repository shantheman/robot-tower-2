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
- [ ] **Final enemy sprites** — the HANDOFF marks the current five as
      temporary ("likely replaced later, possibly animated"). Boss, Shooter,
      and the in-battle drone still use the old pygame-era art, which clashes
      with the new painterly style.
- [ ] **App icon + favicon** — there is none. Needed for the browser tab,
      PWA install, and app stores.
- [ ] **Loading/splash screen** — first load shows a blank stage for a beat;
      a branded splash would cover asset load (also required for Capacitor).

## Code health

- [ ] **Split BattleScene** — it's ~650 lines and owns combat, drone, juice,
      ultimates, and wave flow. Carve out drone.ts and effects.ts when it
      next grows (e.g. Wingman is the natural trigger).
- [ ] **Gate the debug handles** — `window.rt2` / `window.rt2scene` are
      exposed unconditionally (the QA driver uses them). Wrap in
      `if (import.meta.env.DEV)` before any public deploy.
- [ ] **Scripted E2E harness** — the headless QA pattern (drive
      `sys.step()`, assert sim state) gets rebuilt ad hoc in the preview
      console every session. Codify as Playwright tests so CI plays a level
      end-to-end.
- [ ] **Orientation live-swap** — the world size (960×720 vs 640×1280) is
      picked at boot; rotating mid-session letterboxes until reload. Decide:
      live re-world (restart battle on rotate?) or a "rotate back" hint.
- [ ] **Input routing consolidation** — keyboard shortcuts live in main.ts,
      Space lives in Phaser, buttons in each panel. Fine today; consolidate
      if key rebinding ever lands.

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
