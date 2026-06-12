# Mech Tide — Visual Design Handoff

This package is a **visual design reference** built in HTML/CSS/React purely for mockup purposes. You are **rebuilding the app from scratch in a new tech stack** — so none of this code is meant to be reused directly. Treat it as a **visual spec** to reimplement.

---

## ⚠️ Read first — how to use this package

1. **These mocks are PURELY for visuals. The current app is the source of truth for everything else.**
   Take from these files only the **look**: color, fonts, spacing, gradients, layout, hierarchy, card/button styling, states, motion feel. **Do NOT take content or logic from them.** All actual content, items, numbers, prices, wording, and behavior must be translated directly from the **current app**. **Wherever the mock and the current app differ on anything other than pure visuals, the current app wins.** The labels/values in these mocks are illustrative placeholders, even where they happen to resemble real items.

2. **Enemy sprites are temporary.**
   The 5 enemy PNGs are better than the current placeholders, so **use them for now** — you can decide which sprite maps to which enemy type. But they still aren't quite right; we'll **likely replace them later with better, animated sprites**. Don't build anything that assumes these are final (e.g. design for swappable, possibly animated, sprite sheets).

---

## Art assets (in `/sprites`)

| File | Use | Notes |
|---|---|---|
| `turret_base.png` | Tower **base** (static, top-down) | The round mounting disc. See pivot notes below. |
| `turret_gun.png` | Tower **gun** (rotates to aim) | Twin-barrel. Swivels to face target, fires bullets. |
| `enemy_0.png` | enemy — "Skitter Walker" (placeholder name) | top-down, faces up at 0° |
| `enemy_1.png` | enemy — "Strike Drone" | top-down |
| `enemy_2.png` | enemy — "Siege Tank" | top-down |
| `enemy_3.png` | enemy — "Brute / mini-boss" | top-down, larger |
| `enemy_4.png` | enemy — "Swarm Mites" cluster | top-down |

All sprites are **top-down** and drawn **facing up (north)**. Rotate them in-engine to face direction of travel (enemies) or target (gun).

---

## Turret rig (important — this took iteration to get right)

The tower is **two layers**: a static base + a gun that rotates to aim.

- The gun's **pivot point** is at **(50%, 79%)** of `turret_gun.png` (centered horizontally, 79% down — this is the swivel disc, near the bottom).
- The base's **mount socket** is at **(50%, 43%)** of `turret_base.png` (centered horizontally, 43% down — *above* the geometric center).
- **Rule:** render the base so its (50%, 43%) socket point sits at the tower's world position, and rotate the gun around its (50%, 79%) pivot placed at that same point. The two points must coincide. Then the gun's disc stays locked while the barrels swing.
- Gun rotation = angle from tower to current target. The unrotated gun points up (north = -90° in screen coords), so `gun_angle_deg = atan2(dy, dx) + 90`.

## Combat feel (from the mock)
- Gun **targets the nearest enemy**, swivels to it, fires **bullets** (not lasers).
- Fire rate ≈ **3 shots/sec**. Bullets are visible tracers that travel **~3× enemy speed** outward from the barrel tips, alternating barrels.
- Muzzle flash at barrel tips on each shot.
- *(These numbers describe the visual feel of the mock — use the current app's real values.)*

---

## Screens in the mock (`Battle Screen - Real Art.html`)

**Battle HUD**
- Top-left: **Level** (cyan) + **Wave** (red), side by side.
- Top-center: **Tower Integrity** bar (640/1000 placeholder).
- Top-right: **Money** (gold coin) + **Cores** (cyan diamond) counters, then a **gear** Settings button (popover with Sound toggle; room for more).
- Bottom-left: **Skill Tree** button — shortcut **T**, pauses game.
- Bottom-right: **Upgrades** button — shortcut **Tab**, pauses game.
- Concentric range rings radiate from the tower (fade with distance).

**Upgrades panel** (`panels.jsx` → polished version; opens on Tab, pauses)
- Hero **Tower Level** callout at top, visually distinct, with a green **✦ PERMANENT** badge and a level-up button priced in **cores** + a 10-pip progress meter.
- **FIELD UPGRADES** section (header notes “↺ reset at end of level”): a multi-column grid of cards priced in **coins**.
- **ULTIMATES** section (“own many · click to equip · [Space] fires it”): a row of cards.
- Card states define the whole spec — **buy** (cyan border + gold coin price), **too-expensive** (dimmed, grey price), **owned** (green + “✓ OWNED”), **equipped** (green + “✓ EQUIPPED”).
- Two header states: **WAVE CLEARED** (shows a **Start Next Wave** button) vs **BATTLE PAUSED** (shows “[Tab/Esc] Close & resume”). ← *style only; use the current app's real items, levels, and prices.*

**Skill Tree panel** (`panels.jsx`; opens on T, pauses)
- Columns of vertical node chains with connectors (the connector below an owned node lights up).
- **Color means STATE, not category** — a legend at top spells it out: **green = OWNED**, **cyan = AVAILABLE** (shows a cores price), **dim = LOCKED** (padlock + “needs [prereq]”). Categories are carried by the **column headers** only, never by node color.
- Powered by **Cores** only. ← *style only; use the current app's real skills and tree structure.*

**Game-flow screens**
- **Wave Intro** — big "WAVE N" over the dimmed battlefield with a 3-2-1 countdown.
- **You Died** — "YOU DIED"; animated **salvage**: Money → Cores at **100:1**. On death: Money resets to 0 (converted to cores), **Upgrades reset**, but **Cores, Tower Level, and Skill Tree unlocks persist**. Player resumes at **Wave 1 of the level they died on**.
- **Home** — two states:
  - *New player*: New Game / Skill Tree / Settings.
  - *Returning player*: a progress strip (reached level, cores, tower level, skills) + **Continue** (jumps to Wave 1 of current level) / Skill Tree / Settings.

## Visual system
- **Palette:** dark navy battlefield (`#081120`–`#0e1b30`), blue/cyan defender accents (`#7fe8ff`, `#3b9dff`), red/orange enemies (`#ff5238`/`#ff9341`), gold money (`#ffc94a`), cyan-diamond cores. Green (`#46e39a`) = owned/positive. **No magenta/pink anywhere.**
- **Fonts (bundle the .ttf, don't use system fonts):** **Chakra Petch** for HUD, numbers, titles, and all-caps labels; **Space Grotesk** for menu/reading text (card names, descriptions, body). Both are SIL OFL, free for commercial use, and render identically across OSes when bundled.
- **Currencies:** Money = gold coin; Cores = cyan diamond. Always pair the value with its icon.
- **State colors are reserved:** green = owned/equipped, cyan = available/affordable, dim = locked/unaffordable. Don't reuse these hues for decoration or categories.

> A companion file, **`UI-CLEANUP-BRIEF.md`**, has the detailed type scale, 8px spacing grid, and per-screen fixes — read it alongside this.

---

*Open `Battle Screen - Real Art.html` in a browser to see everything live (it's a pan/zoom canvas — drag to move, scroll to zoom, double-click an artboard to focus). Source components: `battle-live.jsx` (battle HUD), `screens.jsx` (wave intro / death), `home.jsx` (home states), `panels.jsx` (skill tree / upgrades store).*
