/** Animation Playground — a standalone dev page (linked from Settings) to
 * inspect each enemy in its states (idle / moving / firing / explode) and
 * tune the procedural-animation values live, then copy them into config's
 * ENEMY_ANIM. Fully separate from the game (own page, own Phaser instance);
 * delete this file + playground.html + the Settings link to remove it.
 *
 * It uses the SAME enemyAnimFrame() the battle scene uses, so what you tune
 * here is exactly what the game will do. */

import Phaser from "phaser";
import "./styles.css";
import * as C from "./config";
import { enemyAnimFrame, updateEnemyRotors, updateSquadron } from "./scenes/enemyAnim";
import { makeSilhouette, shadowOffset } from "./scenes/shadows";
import { Effects } from "./scenes/effects";

type State = "idle" | "moving" | "firing" | "explode";

const ENEMIES: { key: string; label: string; type: C.EnemyType }[] = [
  { key: "grunt", label: "Grunt", type: C.GRUNT },
  { key: "fast", label: "Fast (quad)", type: C.FAST },
  { key: "tough", label: "Tough", type: C.TOUGH },
  { key: "tank", label: "Tank", type: C.TANK },
  { key: "bomber", label: "Bomber", type: C.BOMBER },
  { key: "boss", label: "Boss", type: C.BOSS },
  { key: "shooter", label: "Shooter (ranged)", type: C.SHOOTER },
];
const byKey = (k: string) => ENEMIES.find((e) => e.key === k)!;

// Live, editable copy of the animation table (plain data → JSON clone is fine).
const params: Record<string, C.EnemyAnim> = JSON.parse(JSON.stringify(C.ENEMY_ANIM));

// Shared state read by the scene each frame, written by the DOM controls.
const pg = {
  key: "fast",
  state: "idle" as State,
  zoom: 2.6,
  slow: false,
  dirty: true, // rebuild the enemy when key/state changes
};

const TOWER_X = 500;
const TOWER_Y = 360;

// ---------------------------------------------------------------------------
// Phaser scene: the tower marker + the selected enemy, animated per state.
// ---------------------------------------------------------------------------
class PlaygroundScene extends Phaser.Scene {
  private effects!: Effects;
  private shadowLayer!: Phaser.GameObjects.Layer;
  private rangeRing!: Phaser.GameObjects.Graphics;
  private enemy?: {
    sprite: Phaser.GameObjects.Image;
    shadow: Phaser.GameObjects.Image;
    type: C.EnemyType;
    baseScale: number;
    phase: number;
    ox: number; oy: number;          // last hover offset (undone each frame)
    fireTimer: number;
    explodeTimer: number;
    visible: boolean;
    rotors?: Phaser.GameObjects.Image[];
    rotorAngle: number;
    squadronWings?: Phaser.GameObjects.Image[];
    squadronPhases: number[];
  };
  private shots: { dot: Phaser.GameObjects.Arc; vx: number; vy: number }[] = [];
  private clock = 0;

  constructor() { super("pg"); }

  preload(): void {
    this.load.image("turret_base", "sprites/turret_base.png");
    this.load.image("turret_gun", "sprites/turret_gun.png");
    for (const k of ["enemy_0", "enemy_1", "enemy_2", "enemy_3", "enemy_4", "boss", "shooter"]) {
      this.load.image(k, `sprites/${k}.png`);
    }
    for (const t of [C.GRUNT, C.FAST, C.TOUGH, C.TANK, C.BOMBER, C.BOSS, C.SHOOTER]) {
      if (t.rotors) this.load.image(t.rotors.texture, `sprites/${t.rotors.texture}.png`);
    }
  }

  create(): void {
    this.shadowLayer = this.add.layer();
    // Tower marker for facing/scale reference.
    const base = this.add.image(TOWER_X, TOWER_Y, "turret_base").setOrigin(C.BASE_SOCKET.x, C.BASE_SOCKET.y);
    base.setScale(C.TURRET_BASE_W / base.width);
    const gun = this.add.image(TOWER_X, TOWER_Y, "turret_gun").setOrigin(C.GUN_PIVOT.x, C.GUN_PIVOT.y);
    gun.setScale(C.TURRET_GUN_H / gun.height).setRotation(-Math.PI / 2);
    this.rangeRing = this.add.graphics();
    this.effects = new Effects(this); // its fx layer draws above for the burst
    this.rebuild();
  }

  /** (Re)create the selected enemy for the current state. */
  private rebuild(): void {
    this.enemy?.sprite.destroy();
    this.enemy?.shadow.destroy();
    this.enemy?.rotors?.forEach(r => r.destroy());
    this.enemy?.squadronWings?.forEach(r => r.destroy());
    for (const s of this.shots) s.dot.destroy();
    this.shots = [];
    this.rangeRing.clear();

    const { type } = byKey(pg.key);
    const air = !!type.air;
    const start = this.startPos();
    const sprite = this.add.image(start.x, start.y, type.sprite);
    const gameScale = (type.radius * C.ENEMY_SPRITE_SCALE) / sprite.width;
    const baseScale = gameScale * pg.zoom;
    sprite.setScale(baseScale);
    const shadow = makeSilhouette(this, this.shadowLayer, type.sprite, start.x, start.y, baseScale, air);
    // Squadron wings render below the leader; create them then lift sprite to top.
    const squadronPhases = type.squadron
      ? type.squadron.offsets.map(() => Math.random() * Math.PI * 2) : [];
    const squadronWings = type.squadron
      ? type.squadron.offsets.map(() =>
          this.add.image(start.x, start.y, type.sprite).setScale(baseScale))
      : undefined;
    if (squadronWings?.length) this.children.bringToTop(sprite);
    this.enemy = {
      sprite, shadow, type, baseScale,
      phase: Math.random() * Math.PI * 2,
      ox: 0, oy: 0,
      fireTimer: type.ranged?.fireCd ?? 0,
      explodeTimer: 0,
      visible: true,
      rotorAngle: 0,
      rotors: type.rotors
        ? [0, 1, 2, 3].map(() =>
            this.add.image(start.x, start.y, type.rotors!.texture).setScale(baseScale))
        : undefined,
      squadronWings, squadronPhases,
    };

    if (pg.state === "firing" && type.ranged) {
      this.rangeRing.lineStyle(1, 0xff5238, 0.25).strokeCircle(TOWER_X, TOWER_Y, type.ranged.fireRange);
    }
  }

  /** Where the enemy starts, by state (firing sits in range; moving enters
   * from the left; idle/explode sit a comfortable distance out). */
  private startPos(): { x: number; y: number } {
    const type = byKey(pg.key).type;
    if (pg.state === "firing" && type.ranged) {
      return { x: TOWER_X - type.ranged.fireRange * 0.8, y: TOWER_Y };
    }
    if (pg.state === "moving") return { x: 120, y: TOWER_Y };
    return { x: TOWER_X - 230, y: TOWER_Y };
  }

  update(_t: number, dMs: number): void {
    const dt = Math.min(dMs / 1000, 0.05) * (pg.slow ? 0.25 : 1);
    this.clock += dt;
    if (pg.dirty) { pg.dirty = false; this.rebuild(); }
    const e = this.enemy;
    if (!e) return;
    const spr = e.sprite;

    // Undo last frame's hover so movement integrates the logical position.
    spr.x -= e.ox; spr.y -= e.oy; e.ox = 0; e.oy = 0;

    if (e.visible) {
      if (pg.state === "moving") {
        const dx = TOWER_X - spr.x, dy = TOWER_Y - spr.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) { const s = this.startPos(); spr.setPosition(s.x, s.y); }
        else { const sp = 90; spr.x += (dx / dist) * sp * dt; spr.y += (dy / dist) * sp * dt; }
      } else if (pg.state === "firing" && e.type.ranged) {
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          e.fireTimer = e.type.ranged.fireCd;
          const dx = TOWER_X - spr.x, dy = TOWER_Y - spr.y, d = Math.hypot(dx, dy);
          const dot = this.effects.track(this.add.circle(spr.x, spr.y, C.ENEMY_BULLET_RADIUS * pg.zoom * 0.5, 0xff5238));
          this.shots.push({ dot, vx: (dx / d) * C.ENEMY_BULLET_SPEED, vy: (dy / d) * C.ENEMY_BULLET_SPEED });
        }
      } else if (pg.state === "explode") {
        e.explodeTimer -= dt;
        if (e.explodeTimer <= 0) {
          e.explodeTimer = 1.4;
          this.effects.burst(spr.x, spr.y, e.type === C.BOSS ? 22 : 10);
          e.visible = false;
          spr.setVisible(false); e.shadow.setVisible(false);
          e.rotors?.forEach(r => r.setVisible(false));
          e.squadronWings?.forEach(r => r.setVisible(false));
          this.time.delayedCall(700, () => {
            if (!this.enemy) return;
            const s = this.startPos();
            this.enemy.sprite.setPosition(s.x, s.y).setVisible(true);
            this.enemy.shadow.setVisible(true);
            this.enemy.rotors?.forEach(r => r.setVisible(true));
            this.enemy.squadronWings?.forEach(r => r.setVisible(true));
            this.enemy.visible = true;
          });
        }
      }

      const charge = pg.state === "firing" && e.type.ranged
        ? 1 - Math.max(0, e.fireTimer) / e.type.ranged.fireCd : 0;
      const { ox, oy } = enemyAnimFrame({
        sprite: spr, shadow: e.shadow, anim: params[pg.key], clock: this.clock,
        phase: e.phase, baseScale: e.baseScale, fireCharge: charge, towerX: TOWER_X, towerY: TOWER_Y,
      });
      e.ox = ox; e.oy = oy;
      const off = shadowOffset(e.type.radius, !!e.type.air);
      const z = pg.zoom;
      e.shadow.setPosition(spr.x - ox + off.x * z, spr.y - oy + off.y * z);
      if (e.rotors && e.type.rotors) {
        e.rotorAngle += dt * e.type.rotors.spinRads;
        updateEnemyRotors(spr, e.rotors, e.type.rotors.armReach, e.rotorAngle);
      }
      if (e.squadronWings && e.type.squadron) {
        const sq = e.type.squadron;
        updateSquadron(spr, e.squadronWings, sq.offsets, sq.driftAmp, sq.driftHz, this.clock, e.squadronPhases);
      }
    }

    // Advance shots; despawn at the tower.
    for (const s of this.shots) { s.dot.x += s.vx * dt; s.dot.y += s.vy * dt; }
    this.shots = this.shots.filter((s) => {
      if (Math.hypot(s.dot.x - TOWER_X, s.dot.y - TOWER_Y) < 24) { s.dot.destroy(); return false; }
      return true;
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "pg-stage",
  width: 1000,
  height: 720,
  transparent: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PlaygroundScene],
});

// ---------------------------------------------------------------------------
// DOM controls.
// ---------------------------------------------------------------------------
const SLIDERS: { k: keyof C.EnemyAnim; label: string; min: number; max: number; step: number; pct?: boolean }[] = [
  { k: "altitude", label: "Altitude (px)", min: -20, max: 30, step: 0.5 },
  { k: "bobAmp", label: "Hover bob (px)", min: 0, max: 16, step: 0.5 },
  { k: "bobHz", label: "Bob speed (Hz)", min: 0, max: 6, step: 0.1 },
  { k: "breatheAmp", label: "Breathe", min: 0, max: 0.15, step: 0.005, pct: true },
  { k: "breatheHz", label: "Breathe speed (Hz)", min: 0, max: 5, step: 0.1 },
  { k: "wobbleDeg", label: "Wobble (deg)", min: 0, max: 20, step: 0.5 },
  { k: "wobbleHz", label: "Wobble speed (Hz)", min: 0, max: 8, step: 0.1 },
];

const css = document.createElement("style");
css.textContent = `
  #pg-stage { position: fixed; inset: 0; background:
    radial-gradient(120% 120% at 50% 50%, #0e1b30 0%, #081120 55%, #04080f 100%); }
  #pg-panel {
    position: fixed; top: 0; right: 0; bottom: 0; width: 320px; overflow-y: auto;
    background: rgba(8,14,28,0.92); border-left: 1px solid rgba(127,232,255,0.18);
    padding: 16px; font-family: "Chakra Petch", sans-serif; color: #c4d3ee;
    backdrop-filter: blur(8px);
  }
  #pg-panel h1 { font-size: 17px; color: var(--cyan); letter-spacing: .08em; margin: 0 0 2px; }
  #pg-panel .sub { font-size: 11px; color: #6b86b0; margin-bottom: 14px; }
  #pg-panel .grp { margin: 14px 0 6px; font-size: 11px; letter-spacing: .14em; color: #6b86b0; }
  #pg-panel .row { display: flex; flex-wrap: wrap; gap: 6px; }
  #pg-panel button {
    flex: 1 1 auto; padding: 8px 10px; border-radius: 9px; cursor: pointer; font: 600 12px "Chakra Petch", sans-serif;
    background: rgba(14,27,48,0.85); border: 1px solid var(--line-strong); color: #c4d3ee;
  }
  #pg-panel button.on { border-color: var(--cyan); color: var(--cyan); background: rgba(127,232,255,0.12); }
  #pg-panel button:disabled { opacity: .35; cursor: default; }
  #pg-panel .sl { margin: 10px 0; }
  #pg-panel .sl label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
  #pg-panel .sl b { color: var(--cyan); font-variant-numeric: tabular-nums; }
  #pg-panel input[type=range] { width: 100%; }
  #pg-panel .chk { display: flex; align-items: center; gap: 8px; font-size: 12px; margin: 8px 0; }
  #pg-panel a.back { display: inline-block; font-size: 12px; color: #6b86b0; margin-bottom: 10px; }
  #pg-panel textarea {
    width: 100%; height: 120px; margin-top: 8px; border-radius: 8px; padding: 8px; resize: vertical;
    background: rgba(4,8,15,0.9); color: #8fe; border: 1px solid var(--line); font: 11px ui-monospace, monospace;
  }
  #pg-panel .cta { background: linear-gradient(180deg,#2bb4e0,#1d83c8); color:#04121f; border-color: rgba(180,240,255,.6); }
`;
document.head.appendChild(css);

const panel = document.getElementById("pg-panel")!;

function render(): void {
  const ranged = !!byKey(pg.key).type.ranged;
  if (pg.state === "firing" && !ranged) pg.state = "idle";
  panel.innerHTML = `
    <a class="back" href="index.html">&lsaquo; Back to game</a>
    <h1>ANIMATION PLAYGROUND</h1>
    <div class="sub">Dev tool — tune, then Copy config and paste into ENEMY_ANIM.</div>

    <div class="grp">ENEMY</div>
    <div class="row" id="pg-enemies">
      ${ENEMIES.map((e) => `<button data-key="${e.key}" class="${e.key === pg.key ? "on" : ""}">${e.label}</button>`).join("")}
    </div>

    <div class="grp">STATE</div>
    <div class="row" id="pg-states">
      ${(["idle", "moving", "firing", "explode"] as State[]).map((s) =>
        `<button data-state="${s}" class="${s === pg.state ? "on" : ""}" ${s === "firing" && !ranged ? "disabled" : ""}>${s}</button>`).join("")}
    </div>

    <div class="grp">ANIMATION — ${byKey(pg.key).label.toUpperCase()}</div>
    <div id="pg-sliders">
      ${SLIDERS.map((s) => {
        const raw = (params[pg.key]?.[s.k] as number) ?? 0;
        const shown = s.pct ? `${Math.round(raw * 100)}%` : raw.toFixed(s.step < 1 ? 1 : 0);
        return `<div class="sl"><label>${s.label}<b data-val="${s.k}">${shown}</b></label>
          <input type="range" data-k="${s.k}" min="${s.min}" max="${s.max}" step="${s.step}" value="${raw}" /></div>`;
      }).join("")}
    </div>
    ${ranged ? `<label class="chk"><input type="checkbox" id="pg-charge" ${params[pg.key]?.chargeTell ? "checked" : ""} /> Charge-tell (swell before firing)</label>` : ""}

    <div class="grp">VIEW</div>
    <div class="sl"><label>Zoom<b data-val="zoom">${pg.zoom.toFixed(1)}×</b></label>
      <input type="range" id="pg-zoom" min="1" max="4" step="0.1" value="${pg.zoom}" /></div>
    <label class="chk"><input type="checkbox" id="pg-slow" ${pg.slow ? "checked" : ""} /> Slow motion (0.25×)</label>

    <div class="grp">EXPORT</div>
    <div class="row"><button class="cta" id="pg-copy">Copy config</button>
      <button id="pg-reset">Reset to current</button></div>
    <textarea id="pg-out" readonly placeholder="Copy config writes the ENEMY_ANIM snippet here…"></textarea>`;

  panel.querySelectorAll<HTMLButtonElement>("#pg-enemies button").forEach((b) =>
    b.addEventListener("click", () => { pg.key = b.dataset.key!; pg.dirty = true; render(); }));
  panel.querySelectorAll<HTMLButtonElement>("#pg-states button").forEach((b) =>
    b.addEventListener("click", () => { if (b.disabled) return; pg.state = b.dataset.state as State; pg.dirty = true; render(); }));
  panel.querySelectorAll<HTMLInputElement>("#pg-sliders input").forEach((inp) =>
    inp.addEventListener("input", () => {
      const k = inp.dataset.k as keyof C.EnemyAnim;
      const v = Number(inp.value);
      (params[pg.key] ??= {})[k] = v as never;
      const spec = SLIDERS.find((s) => s.k === k)!;
      panel.querySelector(`[data-val="${k}"]`)!.textContent = spec.pct ? `${Math.round(v * 100)}%` : v.toFixed(spec.step < 1 ? 1 : 0);
    }));
  const charge = panel.querySelector<HTMLInputElement>("#pg-charge");
  charge?.addEventListener("change", () => { (params[pg.key] ??= {}).chargeTell = charge.checked || undefined; });
  const zoom = panel.querySelector<HTMLInputElement>("#pg-zoom")!;
  zoom.addEventListener("input", () => {
    pg.zoom = Number(zoom.value);
    panel.querySelector('[data-val="zoom"]')!.textContent = `${pg.zoom.toFixed(1)}×`;
    pg.dirty = true;
  });
  panel.querySelector<HTMLInputElement>("#pg-slow")!.addEventListener("change", (ev) => {
    pg.slow = (ev.target as HTMLInputElement).checked;
  });
  panel.querySelector("#pg-copy")!.addEventListener("click", () => {
    const out = buildConfig();
    (panel.querySelector("#pg-out") as HTMLTextAreaElement).value = out;
    navigator.clipboard?.writeText(out).catch(() => {});
  });
  panel.querySelector("#pg-reset")!.addEventListener("click", () => {
    Object.assign(params, JSON.parse(JSON.stringify(C.ENEMY_ANIM)));
    render();
  });
}

/** Serialize the live params as a pasteable ENEMY_ANIM literal (drops zeros
 * and orphan *Hz with no matching amplitude, to keep the table clean). */
function buildConfig(): string {
  const lines = ENEMIES.map(({ key }) => {
    const p = params[key] ?? {};
    const parts: string[] = [];
    if (p.altitude) parts.push(`altitude: ${round(p.altitude)}`);
    if (p.bobAmp) { parts.push(`bobAmp: ${round(p.bobAmp)}`); if (p.bobHz) parts.push(`bobHz: ${round(p.bobHz)}`); }
    if (p.breatheAmp) { parts.push(`breatheAmp: ${round(p.breatheAmp)}`); if (p.breatheHz) parts.push(`breatheHz: ${round(p.breatheHz)}`); }
    if (p.wobbleDeg) { parts.push(`wobbleDeg: ${round(p.wobbleDeg)}`); if (p.wobbleHz) parts.push(`wobbleHz: ${round(p.wobbleHz)}`); }
    if (p.chargeTell) parts.push(`chargeTell: true`);
    return `  ${key}: { ${parts.join(", ")} },`;
  });
  return `export const ENEMY_ANIM: Record<string, EnemyAnim> = {\n${lines.join("\n")}\n};`;
}
const round = (n: number) => Math.round(n * 1000) / 1000;

render();
