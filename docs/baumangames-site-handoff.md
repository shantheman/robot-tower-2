# Handoff: add Mech Tide to baumangames.com

For the Claude Code session that manages the **baumangames.com** repo.
You're adding a new game to the marketing pages and updating the legal
docs (`terms.html`, `privacy.html`) to cover it. Everything you need to
know is in this file — the game's repo is separate and you don't need it.

## The game (facts to draw from)

- **Name:** Mech Tide (working title was "Robot Tower" — don't use that).
- **What it is:** a 360° tower-defense survival game. You aim a central
  turret against waves of robots closing in from every side; earn coins
  in-run for upgrades, bank permanent "Cores" to grow a skill tree across
  runs. 15-wave levels, mid-level checkpoints, bosses, four ultimate
  weapons, painterly sci-fi art.
- **Made by:** Callum Bauman (game design), published by Bauman Games LLC.
  In-game credit reads "A game by Bauman Games"; copyright line is
  "© 2026 Callum Bauman / Bauman Games."
- **Play now (free, browser, desktop + mobile):**
  https://shantheman.github.io/mech-tide/
- **Platforms:** web today; iOS/Android via app stores planned (Capacitor
  wrap, bundle ID `com.baumangames.mechtide`). PWA install likely
  before that.
- **Price/monetization:** free. No ads, no in-app purchases, no accounts.
- **Audience/rating:** general audience, declared 13+ for store purposes;
  cartoon sci-fi robot combat (no blood, no humans harmed).
- **Tech (only if asked):** TypeScript + Phaser 3, runs entirely
  client-side as a static site.

If you need screenshots or key art for the marketing page, leave a
placeholder and note it — Shannon will export assets from the game
(don't fabricate or hotlink the live game's sprites).

## 1) Marketing pages

Add Mech Tide wherever the site lists/showcases games (follow the
existing pattern used for the other titles, e.g. Chimera):

- Game card/entry: name, one-line hook, short description, "Play free in
  your browser" call-to-action linking to the URL above.
- Suggested one-liner: "Hold the center. 360° robot tower defense —
  free in your browser."
- Note it's playable on phones and desktops from the same link.
- If the site has per-game pages, create one matching the existing
  template; otherwise the list entry is enough for now.

## 2) terms.html (Terms of Service)

- Add Mech Tide to whatever enumeration/definition of covered
  products/games the ToS uses (or confirm the ToS is written generically
  enough to cover "all Bauman Games titles" — if so, just say so back to
  Shannon and change nothing).
- Nothing about the game needs special terms: no accounts, no purchases,
  no user-generated content, no multiplayer.

## 3) privacy.html (Privacy Policy)

Current truth (state it plainly if the policy is per-product):

- **Mech Tide collects no personal data.** No accounts, no analytics,
  no ads, no tracking, no server — game progress is saved only in the
  player's own browser (localStorage) and never leaves their device.

**Known upcoming change — write it in only when it ships, not now:**
crash reporting (Sentry or Firebase Crashlytics) will be added before the
iOS App Store release. When that lands, the policy will need: crash and
diagnostic data (stack traces, device model/OS version) collected on app
crashes, used solely to fix bugs, not linked to identity, not used for
tracking or advertising, retained per the vendor's standard window.
Shannon will send a follow-up when it's time; you can leave an HTML
comment near the Mech Tide section as a breadcrumb.

## Tone/consistency notes

- The game's name is always "Mech Tide" (two words, title case).
- In-game currencies are "coins" (in-run) and "Cores" (permanent) — only
  relevant if the marketing copy describes gameplay; never use "$".
- Callum is a kid — keep any bio/credit line to "Callum" or
  "Callum Bauman", nothing more personal.

## Done looks like

- [ ] Mech Tide listed on the marketing page(s) with the play link
- [ ] ToS covers the game (explicitly or generically — report which)
- [ ] Privacy policy covers the game with the "collects no data" truth
- [ ] Breadcrumb comment for the future crash-reporting disclosure
