# Icons + Panels Spec — Upgrades & Skill Tree (desktop + mobile)

Visual spec for adding the art icons to the **Upgrades store** and **Skill Tree** screens. As always: this is **visual design only** — your Pygame implementation's items, costs, and behavior are the source of truth. Names/values here are placeholder. Reference implementation: `panels.jsx` (React/HTML mockup). Live preview: open `Battle Screen - Real Art.html` → "Menu Panels" and "Upgrades — Mobile" / "Skill Tree" artboards.

---

## 1. The icon assets (`/icons`)

15 PNGs, 240×240, trimmed to content on a dark background (they blend into dark cards). Naming = order/category:

| File | Item | Category |
|---|---|---|
| `01_main_turret.png` | Main Turret | Cannon |
| `02_multi_shot.png` | Multi-Shot | Cannon |
| `03_piercing.png` | Piercing | Cannon |
| `04_explosive.png` | Explosive | Cannon |
| `05_guided.png` | Guided | Cannon |
| `06_repair.png` | Repair | Defense |
| `07_plating.png` | Plating | Defense |
| `08_shield.png` | Shield | Defense |
| `09_drone.png` | Drone | Drone |
| `10_auto_shooter.png` | Twin Targeting (quadcopter, twin beams) | Drone |
| `11_generator.png` | Generator | Economy |
| `12_emp_burst.png` | EMP Burst | Ultimate |
| `13_freeze_bomb.png` | Freeze Bomb | Ultimate |
| `14_time_warp.png` | Time Warp | Ultimate |
| `15_laser_beam.png` | Laser Beam | Ultimate |

**Map these to whatever your real items are** — the file↔item mapping above matches the mock, but use your actual item list. Icons are decent for now; expect to replace later (possibly animated). Build the slot so the art is swappable.

> Note: the small monochrome **SVG glyphs** (snowflake/bolt/clock/beam) used inside the in-battle circular **Ultimate FIRE button** are intentionally separate from these painterly icons — a clean glyph reads better at HUD size. Don't replace the fire-button glyph with these art images.

---

## 2. Upgrades store — card layout (art bleeds in from the RIGHT)

Each upgrade card:
- **Card:** rounded 13px, 1px border, subtle fill, `overflow: hidden`, min-height ~104px (desktop). Vertical: text block top, price/owned bottom.
- **Art:** the icon image is positioned **absolute, anchored to the right edge, at full cell height** (slightly oversized — ~118% height, nudged ~6px off the right edge so it bleeds). It is the card's right-side background.
- **Scrim:** a left→right gradient over the art for legibility — opaque card-color on the left ~34%, fading to transparent by ~88%:
  `linear-gradient(90deg, #0b1730 0%, #0b1730 34%, rgba(11,23,48,0.7) 52%, rgba(11,23,48,0.1) 74%, transparent 88%)`
- **Text (left-aligned, above scrim):** name (Space Grotesk 700, ~15–16px), description (~11–12px muted, capped to ~64% width so it doesn't run under the art), then the **price chip** (or OWNED/EQUIPPED label) at the bottom-left.

**Grid (cards per row):** desktop 5 · mobile landscape 4 · mobile portrait 2. Cards are grouped under category headers (Cannon / Defense / Drone / Economy), with the **Ultimates** section in its own row (4-up desktop) below.

**Card states** (same palette as elsewhere — see §4):
- Affordable → cyan border + glow, bright price chip (gold coin).
- Can't afford → muted border, dimmed card (~0.62 opacity), grey price chip, desaturated art.
- Owned / Equipped → green border + glow, "✓ OWNED" / "✓ EQUIPPED" instead of a price.

---

## 3. Skill Tree — node layout (compact left icon tile)

Deliberately **different** from the store: the tree is a progression *map*, so nodes stay compact to keep the branch/connector structure readable. (This difference is intentional — see the reasoning note at the bottom.)

Each node:
- **Card:** rounded 14px, 1px border, subtle fill.
- **Header row:** a small **icon tile** on the left (square ~46px, rounded 10px, dark radial bg, `object-fit: cover`) + a text column (name ~16.5px, description ~12.5px muted). Use a flex column with a small gap so a 2-line name never overlaps the description.
- **Below header:** the state line — "✓ OWNED" (green), a **cores price chip** (cyan diamond) if buyable, or a 🔒 "needs <Prereq>" line if locked.

**Layout:**
- **Desktop:** 4 columns (Cannon / Defense / Drone / Ultimates), each a vertical chain of nodes joined by 2px connector lines (the connector lights up cyan/green under an owned node). Neutral column headers with a category icon.
- **Mobile portrait:** **tabbed** — one category tab row at top (icon + label), showing a single full-width chain for the active branch, plus a "N/M unlocked" summary. (Avoids stacked category headers colliding.)

**Affordability:** a node is bright-cyan "can buy" **only if** its cost ≤ the player's cores; otherwise it shows muted (same treatment as an unaffordable store card). Legend: OWNED · CAN BUY · LOCKED.

---

## 4. Shared state palette (use everywhere)

| State | Border | Fill (top→bottom) | Glow | Text/price |
|---|---|---|---|---|
| Affordable / Can buy | `rgba(127,232,255,0.55)` | `rgba(127,232,255,0.10)` → `rgba(10,20,36,0.5)` | `0 0 18px rgba(127,232,255,0.22)` | cyan `#7fe8ff` |
| Can't afford | `rgba(120,160,230,0.16)` | `rgba(8,14,28,0.45)` | none | muted `#6b86b0`, card ~0.62 opacity |
| Owned / Equipped | `rgba(70,227,154,0.7)` | `rgba(70,227,154,0.13)` → `rgba(10,30,24,0.5)` | `0 0 16px rgba(70,227,154,0.18)` | green `#46e39a` |

**Price chips:** money = gold coin `#ffc94a` on `rgba(255,201,74,0.12)` / border `rgba(255,201,74,0.4)`; cores = cyan diamond `#7fe8ff` on `rgba(127,232,255,0.16)` / border `rgba(127,232,255,0.6)`. When unaffordable, both go grey/dim.

Fonts: **Chakra Petch** (labels/numbers/headers), **Space Grotesk** (names/descriptions). Money = gold coin, Cores = cyan diamond.

---

## Why the two screens look different (intentional)
The **store** is merchandising — art-forward cards you scan and buy fast. The **skill tree** is a progression map whose value is showing structure (branches, prerequisites, owned→available→locked). Big background art would bury the connectors and force long scrolling, so tree nodes stay compact. They're unified by shared **art, color-states, type, and currency chips** — not by identical card shapes.
