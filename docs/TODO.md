# Mech Tide — Master TODO

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

- [ ] **Final enemy sprites** — the HANDOFF marks the current five as
      temporary ("likely replaced later, possibly animated"). Boss, Shooter,
      and the in-battle drone still use the old pygame-era art, which clashes
      with the new painterly style.
- [ ] **App icon** — favicon shipped (the crystal core); still needed: the
      proper app icon set for the PWA manifest and app stores (512px+,
      maskable, Android adaptive layers).
- [ ] **Loading/splash screen** — first load shows a blank stage for a beat;
      a branded splash would cover asset load (also required for Capacitor).

## Code health

Full audit + cleanup pass completed 2026-06-12 (see git history): the sim
core is clean and tested (27 unit tests + a 4-flow Playwright e2e suite in
CI), BattleScene is split into focused modules, panels share a base class,
keyboard shortcuts live in one map (src/input.ts), CI is SHA-pinned and
least-privilege, production builds ship a CSP, and innerHTML interpolation
goes through esc(). Open a fresh audit when the codebase next grows a
major system.

## Launch readiness

- [ ] **Custom domain** — buy a domain and serve the game from it; hosting
      stays on GitHub Pages (fully supported: set the custom domain in the
      repo's Pages settings + add a `public/CNAME` file so Actions deploys
      keep it; DNS = CNAME record -> shantheman.github.io for a subdomain,
      or A/AAAA records for an apex; HTTPS is automatic via Let's Encrypt;
      also "verify" the domain on the GitHub account to block takeovers).
      Domain availability for "mechtide" was NOT checked — Shannon doesn't
      care about the domain (the name was vetted only for Steam / App Store /
      Google Play conflicts). Zero-cost option remains a subdomain of
      baumangames.com (play.baumangames.com). Code change is tiny: the
      Pages base path becomes "/" instead of /mech-tide/, and GitHub
      auto-redirects the old github.io URL to the new domain.
      ⚠️ **Do this EARLY**: localStorage saves are per-origin, so the move
      orphans every existing save — cheap now, painful after launch (or
      gate on the save export/import item below).
- [ ] **PWA pass** — manifest + icons + service worker: installable to the
      home screen, runs offline, fullscreen standalone on iOS. Cheap, and a
      real alternative to app stores for the friend-circle audience.
      Blocked on the app icon (Art section).
- [ ] **Capacitor wrap (iOS/Android)** — the real-app path: haptics, app
      icon, splash, store listing. Publishing under **Bauman Games LLC**
      (Apple org account exists). Bundle ID: **com.baumangames.mechtide**
      (matches the com.baumangames.chimera convention).
- [ ] **Desktop packaging decision** — Tauri/Electron, or is "it runs in any
      browser" enough for desktop? (Leaning: browser is enough until proven
      otherwise.)
- [x] **Save export/import** — DONE (2026-06-12): Settings > Transfer
      save. EXPORT copies a CD1. save code (also shown for manual copy);
      IMPORT + LOAD (two-tap confirm) applies it and reloads. This is the
      migration path for the custom-domain move and phone<->desktop
      transfer. Cloud saves remain out of scope.
- [x] **Crash safety net** — DONE (2026-06-12): src/crash.ts (imported
      first in main.ts) catches uncaught errors + rejections and shows a
      framework-free reload banner with version + error detail. The hook
      point for the future crash-reporting SDK.
- [ ] **Performance pass on older phones** — tested on Shannon's recent
      iPhone only. Check an older device + Android; watch particle counts on
      late waves.
- [ ] **Browser-compat sweep** — developed against Safari/Chrome; give
      Firefox and Android Chrome one full playthrough.
- [ ] **LICENSE + asset provenance** — carried from v1, still unresolved:
      no LICENSE file; confirm the AI-generated art/sprites are cleared for
      whatever distribution ends up happening.
- [ ] **ToS / Privacy Policy + marketing site** — handled in the
      baumangames.com repo; the handoff brief for that session is
      `docs/baumangames-site-handoff.md`. Crash-data disclosure gets added
      there only once the crash SDK ships.
- [ ] **Crash reporting** — DECIDED (2026-06-12): yes, before the Apple
      submission. Shannon leans Crashlytics; consider Sentry instead — in
      a Capacitor app most "crashes" are JS errors in the webview, which
      Sentry captures first-class without the Firebase/google-services
      setup. Crash data only, no analytics.

### Store submission checklist (Apple + Google Play)

Context decided 2026-06-12: publisher **Bauman Games LLC**, bundle ID
**com.baumangames.mechtide**, target audience **13+** (avoids kids/
Families policy), ToS + Privacy Policy live at baumangames.com.

**Legal / policy**
- [ ] baumangames.com updates (see docs/baumangames-site-handoff.md).
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
- [ ] Reserve the "Mech Tide" name in App Store Connect early (name
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

- [ ] Onboarding: is a tutorial needed, or is the friend-circle audience
      fine learning by dying? (v1 carried this question too.)
- [ ] Accessibility beyond reduce-motion: colorblind-safe palette and text
      scaling — worth it pre-launch or post?
