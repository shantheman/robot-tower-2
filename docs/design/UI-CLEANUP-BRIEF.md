# Mech Tide — UI Cleanup Brief (for Claude Code / Pygame)

The screens work, but they look unpolished next to the design mockups. The problems are almost all **typography, spacing, and alignment** — not new features. Below are concrete, do-this-exactly fixes. Functionality is still your source of truth; this is purely visual.

---

## 0. The #1 fix: TWO bundled fonts, used consistently

Right now the text looks inconsistent because it's likely using `pygame.font.SysFont(...)`, which renders a **different font on Mac vs Windows** and gives you no weight control. Stop doing that. Bundle the actual `.ttf` files and load them — then it's pixel-identical on Mac and Windows.

The mockups use **two** typefaces, each with a clear job. Both are free for commercial use (SIL Open Font License 1.1) and embeddable:

- **Chakra Petch** — the squared, techy face. Use for the **HUD and "machine" text**: the in-battle HUD (LEVEL/WAVE/INTEGRITY/kills/counters), big numeric callouts ("WAVE 5", "YOU DIED"), all-caps `LABEL`s, key hints like `[Tab]`. → https://fonts.google.com/specimen/Chakra+Petch
- **Space Grotesk** — the cleaner, more neutral face. Use for **menu & reading text**: panel titles, card titles, descriptions, button labels, achievement rows, paragraph/help copy. → https://fonts.google.com/specimen/Space+Grotesk

Rule of thumb: **numbers, HUD, and stamped-metal labels = Chakra Petch; words you read = Space Grotesk.** Two fonts, no more — don't add a third.

1. Bundle these into `assets/fonts/`:
   - `ChakraPetch-Medium.ttf` (500), `ChakraPetch-SemiBold.ttf` (600), `ChakraPetch-Bold.ttf` (700)
   - `SpaceGrotesk-Regular.ttf` (400), `SpaceGrotesk-Medium.ttf` (500), `SpaceGrotesk-Bold.ttf` (700)
2. Load with `pygame.font.Font("assets/fonts/ChakraPetch-Medium.ttf", size)` — **never** `SysFont`.
3. **Always render with antialias on:** `font.render(text, True, color)`. (Several labels look aliased/rough — that's `True` missing.)
4. Cache one `Font` object per (file, size); don't recreate per frame.

### Type scale (define these once as named constants; sizes assume a ~1280-tall window — scale proportionally to your actual window height)
| Token | Family / weight | Size | Use |
|---|---|---|---|
| `DISPLAY` | Chakra Petch Bold | 72 | "WAVE 5", "YOU DIED", big HUD numerals |
| `H1` | Chakra Petch Bold | 40 | Panel titles ("UPGRADES", "SKILL TREE") |
| `H2` | Space Grotesk Bold | 26 | Card titles, menu headings |
| `STAT` | Chakra Petch SemiBold | 26 | Big stat numbers (cores, HP, money) |
| `BODY` | Space Grotesk Medium | 20 | Menu text, button labels, descriptions |
| `LABEL` | Chakra Petch SemiBold | 13, **uppercase, +8% letter-spacing**, muted | "TOWER INTEGRITY", "CORES", "LEVEL", "SALVAGE" |
| `SMALL` | Space Grotesk Regular | 15 | Sub-text, hints, help copy |

All-caps labels need letter-spacing or they look cramped — Pygame has no native tracking, so render each glyph with a small gap, or use `pygame.freetype` which supports it.

---

## 1. Spacing & alignment system (this fixes most of the "off" feeling)

Adopt an **8px grid**. Every margin, pad, and gap is a multiple of 8 (8/16/24/32/48).

- **Screen padding:** 48px on all edges. Nothing touches the window edge or floats at a random offset.
- **One left edge:** on the Home screen, the title, subtitle, the Level card, the stat row, and the buttons must **all share the same left x**. Right now they each start at a slightly different x — that's the single biggest "messy" tell.
- **Card padding:** 20px interior padding on every card/panel, top-bottom and left-right. Keep it equal.
- **Vertical rhythm:** consistent gaps between stacked elements — 16px within a group, 32px between groups. The Home buttons currently have uneven gaps; make them all 16px.
- **Panels/cards style (standardize all of them):** corner radius 12px, 1px border, subtle top-to-bottom fill. Use the same three values for every card so they read as one system.
- **Center means optical center:** when you center a block, center the *whole group's* bounding box, not each line independently.

---

## 2. Per-screen fixes

### Home screen
- **Achievements panel** (top-right) is floating with no container and its own left edge. Put it in a proper panel with the standard 20px padding, right-aligned to the 48px screen margin, and top-aligned with the Level card.
- Truncated achievement rows ("Hit a 15+ kill co…") — give the panel enough width, or wrap to a second line; don't hard-cut mid-word.
- The **`earn x1.20  max HP 140  start $60`** stat row is floating in dead space. Attach it directly under the Level card (it describes the tower) with a 16px gap, as a row of small `LABEL`+value pairs.
- **Button alignment is mixed** — "Upgrade Tower" is left-aligned with a right-side price, "Skill Tree" is centered, "Continue" is centered. Pick ONE: left-align the key+label, right-align any price/value, all buttons same width and same internal padding. Stack them with equal 16px gaps.
- "ROBOT TOWER" is good; keep it `DISPLAY` weight but align its left edge to the card below it.

### Battle HUD
- **"TOWER Lv 2" pill overlaps the gun barrels.** Move it to sit *below* the base with an 8px gap, or remove it during combat and only show on hover. It must never overlap the turret art.
- **Enemy sprites are blurry** because small PNGs are being upscaled with smoothing. Either (a) display them near native size, or (b) scale **once** at load and cache, using `smoothscale` for downscaling only. Don't upscale a 48px sprite to 120px. Pick a fixed on-screen size per enemy type and stick to it.
- Top bar: the integrity bar has its numerals overlapping the fill. Either put "132 / 140" *centered inside* the bar with enough bar height (24px) and the text in a contrasting color, or put it as a `LABEL` above the bar — not half-in.
- Check the label spelling/wording is "TOWER INTEGRITY" and matches `LABEL` style.
- "click tower: upgrade" hint — make it `SMALL`, muted, and bottom-centered with clear separation from the side buttons.

### Upgrades panel
- The card grid wraps to a second row with a lone card — that's fine, but the second-row card must align to the **same column grid** as row 1 (same left x as card 1, same width). Right now spacing/widths look slightly off.
- Card title (`H2`), description (`SMALL` muted), price chip (coin icon + value) — give each card the same three-zone vertical layout so they're uniform.
- *(Keep your real upgrade items — the names here are placeholder.)*

### Skill Tree
- **The footer text is magenta/pink** — that color is off-palette. Use the muted cyan/grey used elsewhere (`#8294b8` for hints, `#7fe8ff` for active). No pink anywhere.
- Connector lines between parent/child nodes should be consistent 2px, same cyan, and the nodes evenly spaced on the grid.
- Owned = green outline + "OWNED", available = cyan outline + price, locked = dim + padlock. Keep those three states visually distinct and consistent.
- *(Keep your real skills — placeholder names again.)*

### Wave Intro
- **Broken right now:** the countdown "1" renders huge in the center, overlapping both "WAVE 5" and the "TOWER Lv 2" label. And the dim is only a horizontal letterbox band, not the whole screen.
- Fix: dim the **entire** battlefield evenly (full-screen 45% black overlay, optional slight blur). Then center one clean group: small `LABEL` "LEVEL 4", big `DISPLAY` "WAVE 5", and a small countdown ring or a single countdown digit **below** it with its own space — never overlapping the wave text or the tower.
- The tower/label underneath should be part of the dimmed background, not poking through the countdown.

### You Died
- Layout is close. Just apply the grid: center the group, 32px between the title, the salvage card, the "kept" line, and the continue prompt.
- The salvage divider shows "/ 25" — make the ratio match your real conversion value and render it as `LABEL` so it's clearly an annotation, not a number in the math.
- Keep "Cores, Tower Level & Skill Tree are kept…" as `SMALL` muted — good.

---

## 3. Color tokens (use these exact values everywhere)
| Token | Hex | Use |
|---|---|---|
| bg deep | `#081120` | battlefield / screen background |
| panel fill | `#0e1b30` → `#0a1424` (vertical) | cards, panels |
| border | `#2a3a55` (idle) / `#7fe8ff` (active) | all card/button borders |
| cyan (defender) | `#7fe8ff` | primary accent, values, active |
| green (success/owned) | `#46e39a` | owned, continue, positive |
| red/orange (enemy/danger) | `#ff5238` / `#ff9341` | wave number, danger, enemies |
| gold (money) | `#ffc94a` | money coin + money values |
| core diamond | cyan diamond `#7fe8ff` | cores |
| text | `#e7f0ff` (primary) / `#8294b8` (muted) | body / labels & hints |

Money = gold **coin**; Cores = cyan **diamond**. Always pair the value with its icon, same icon size everywhere. **No magenta/pink anywhere.**

---

## 4. Quick checklist
- [ ] All text uses the two bundled fonts (Chakra Petch for HUD/numbers, Space Grotesk for menu/reading) via `pygame.font.Font`, `antialias=True`, weights from the scale above.
- [ ] 48px screen margins; 8px spacing grid; one shared left edge per screen.
- [ ] Every card: 12px radius, 1px border, 20px padding — identical.
- [ ] No element overlaps another (tower label, wave countdown).
- [ ] Sprites scaled once & cached; no blurry upscaling.
- [ ] Cards/nodes on a real grid (badge numbers themselves are gameplay-driven — leave them alone).
- [ ] Palette tokens only; no pink.
- [ ] Labels uppercase + letter-spacing + muted; values in accent colors with icons.
