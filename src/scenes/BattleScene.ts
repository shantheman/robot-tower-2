/** The battle scene: tower + swiveling gun, waves of enemies, hold-click
 * shooting, drone/auto-shooter, ultimates. Mechanics live in GameState
 * (src/sim/state.ts) — this scene is rendering, motion, and collisions.
 * Visuals per docs/design/HANDOFF.md.
 *
 * The HUD/panels are DOM overlays (src/ui/*) fed via the onHud callback.
 */

import Phaser from "phaser";
import * as C from "../config";
import { game } from "../game";
import { play } from "../audio";
import {
  chooseEnemyType, effectiveWave, isBossWave, waveInLevel, waveRobotCount,
  waveRobotSpeed, waveSpawnInterval, wavesForLevel,
} from "../sim/waves";

export interface HudState {
  level: number; waveInLevel: number; wavesInLevel: number;
  hp: number; maxHp: number; money: number; cores: number;
  shield: number; combo: number; comboMult: number;
  intermission: number;
  ultimate: { key: C.UltimateKey; name: string; ready: boolean; cooldown: number } | null;
  rapid: boolean;
}

interface Enemy {
  sprite: Phaser.GameObjects.Image;
  hpBar?: Phaser.GameObjects.Graphics;
  type: C.EnemyType;
  hp: number; maxHp: number; speed: number;
  fireTimer: number;     // ranged enemies
  flash: number;
  alive: boolean;
}

interface Bullet {
  dot: Phaser.GameObjects.Arc;
  vx: number; vy: number;
  damage: number; radius: number;
  pierce: number;        // extra enemies it may pass through
  guided: boolean;
  hit: Set<Enemy>;       // don't hit the same enemy twice while piercing
  alive: boolean;
}

interface EnemyBullet {
  dot: Phaser.GameObjects.Arc;
  vx: number; vy: number; damage: number;
  alive: boolean;
}

export class BattleScene extends Phaser.Scene {
  private onHud!: (s: HudState) => void;

  private towerPos = new Phaser.Math.Vector2(game.world.w / 2, game.world.h / 2);
  private gun!: Phaser.GameObjects.Image;
  private shieldGfx!: Phaser.GameObjects.Graphics;
  private fxLayer!: Phaser.GameObjects.Layer;
  private drone?: Phaser.GameObjects.Image;
  private droneAngle = 0;
  private droneFireTimer = 0;
  private interceptTimer = 0;
  private medicPulse = 0;
  private autoFireTimer = 0;

  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private toSpawn = 0;
  private spawnTimer = 0;
  private bossPending = false;
  private intermission = C.INTERMISSION_TIME;
  private fireTimer = 0;
  private mouseHeld = false;
  private muzzleAlt = 1;
  private aimAngle = -Math.PI / 2;                       // current gun heading
  private joyOrigin: Phaser.Math.Vector2 | null = null;  // touch: floating joystick anchor
  private joyGfx!: Phaser.GameObjects.Graphics;
  private paused = false;
  private over = false; // tower destroyed; stop simulating

  // Ultimate effect timers (cooldowns are per-ultimate)
  private cooldowns: Record<C.UltimateKey, number> = { emp: 0, freeze: 0, warp: 0, laser: 0 };
  private freezeActive = 0;
  private stunActive = 0;
  private warpActive = 0;
  private laserActive = 0;

  constructor() { super("battle"); }

  init(data: { onHud: (s: HudState) => void }) { this.onHud = data.onHud; }

  preload() {
    this.load.image("turret_base", "sprites/turret_base.png");
    this.load.image("turret_gun", "sprites/turret_gun.png");
    this.load.image("drone", "sprites/drone.png");
    for (const k of ["enemy_0", "enemy_1", "enemy_2", "enemy_3", "enemy_4", "boss", "shooter"]) {
      this.load.image(k, `sprites/${k}.png`);
    }
  }

  create() {
    this.drawBackdrop();
    this.fxLayer = this.add.layer();
    const base = this.add.image(this.towerPos.x, this.towerPos.y, "turret_base")
      .setOrigin(C.BASE_SOCKET.x, C.BASE_SOCKET.y);
    base.setScale(C.TURRET_BASE_W / base.width);
    this.shieldGfx = this.add.graphics();
    this.gun = this.add.image(this.towerPos.x, this.towerPos.y, "turret_gun")
      .setOrigin(C.GUN_PIVOT.x, C.GUN_PIVOT.y);
    this.gun.setScale(C.TURRET_GUN_H / this.gun.height); // mock: gun height = 0.69 x base

    this.joyGfx = this.add.graphics();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.mouseHeld = true;
      // Touch: aim is RELATIVE to where the thumb lands (floating joystick) so
      // the finger never has to cover the tower. Mouse keeps cursor aim.
      if (p.wasTouch) this.joyOrigin = new Phaser.Math.Vector2(p.worldX, p.worldY);
    });
    this.input.on("pointerup", () => { this.mouseHeld = false; this.joyOrigin = null; });
    this.input.keyboard?.on("keydown-SPACE", () => this.fireUltimate());

    game.battle = {
      startBattle: () => this.startBattle(),
      resumeWave: () => this.setPaused(false),
      nextWave: () => this.nextWave(),
      setPaused: (p) => this.setPaused(p),
      fireUltimate: () => this.fireUltimate(),
      retryFromCheckpoint: () => this.retryFromCheckpoint(),
    };
    // Dev/debug handle for the headless QA driver (steps update() manually).
    (window as unknown as Record<string, unknown>).rt2scene = this;
    this.startBattle();
    // If a menu screen (Home) is up, idle paused until it starts a battle.
    if (game.screen !== "battle") this.setPaused(true);
  }

  /** Track a transient effect so startBattle can hard-clear leftovers. */
  private fx<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.fxLayer.add(obj);
    return obj;
  }

  setPaused(p: boolean): void {
    this.paused = p;
    this.mouseHeld = false;
  }

  // -- run / wave flow ---------------------------------------------------------
  startBattle(): void {
    game.gs.resetRun();
    this.clearBoard(true);
    this.fxLayer.removeAll(true);
    this.over = false;
    this.setPaused(false);
    this.drone?.destroy();
    this.drone = undefined;
    this.startWave();
  }

  /** Death-retry from the loadout snapshot (full HP, same gear, same wave). */
  retryFromCheckpoint(): boolean {
    if (!game.gs.restoreCheckpoint()) return false;
    this.clearBoard(true);
    this.fxLayer.removeAll(true);
    this.over = false;
    this.setPaused(false);
    this.drone?.destroy();
    this.drone = undefined;
    this.startWave();
    return true;
  }

  private startWave(): void {
    this.intermission = C.INTERMISSION_TIME;
    this.toSpawn = waveRobotCount(game.gs.wave);
    this.bossPending = isBossWave(game.gs.wave);
    this.spawnTimer = 0;
  }

  private nextWave(): void {
    game.gs.startNextWave();
    this.startWave();
    this.setPaused(false);
  }

  private clearBoard(everything: boolean): void {
    // Between waves nothing may linger and sucker-punch the tower.
    for (const eb of this.enemyBullets) eb.dot.destroy();
    this.enemyBullets = [];
    for (const b of this.bullets) b.dot.destroy();
    this.bullets = [];
    if (everything) {
      for (const e of this.enemies) { e.sprite.destroy(); e.hpBar?.destroy(); }
      this.enemies = [];
    }
  }

  private waveCleared(): void {
    this.clearBoard(false);
    const { bossWave } = game.gs.onWaveCleared();
    if (bossWave) {
      this.setPaused(true);     // CRITICAL: stop simulating under the Home screen
      game.show("home");        // level complete -> Home (cores banked)
    } else {
      game.shopMode = "cleared"; // between-waves shop (Start Next Wave to go on)
      game.show("shop");
      this.setPaused(true);
    }
  }

  private towerDestroyed(): void {
    this.over = true;
    game.gs.save();
    game.show("dead");
  }

  // -- spawning ------------------------------------------------------------------
  private spawnOne(): void {
    const type = this.bossPending ? C.BOSS : chooseEnemyType(game.gs.wave);
    if (this.bossPending) this.bossPending = false;
    const [x, y] = this.edgePosition();
    const sprite = this.add.image(x, y, type.sprite);
    sprite.setScale((type.radius * C.ENEMY_SPRITE_SCALE) / sprite.width);
    const ew = effectiveWave(game.gs.wave);
    const hp = type.levelScaled ? type.hp * (1 + C.HEAVY_HP_RAMP * (ew - 1)) : type.hp;
    this.enemies.push({
      sprite, type, hp, maxHp: hp, alive: true, flash: 0,
      fireTimer: type.ranged?.fireCd ?? 0,
      speed: waveRobotSpeed(game.gs.wave) * type.speedMult,
    });
  }

  private edgePosition(): [number, number] {
    const { w, h } = game.world;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return [Math.random() * w, -C.SPAWN_MARGIN];
    if (side === 1) return [Math.random() * w, h + C.SPAWN_MARGIN];
    if (side === 2) return [-C.SPAWN_MARGIN, Math.random() * h];
    return [w + C.SPAWN_MARGIN, Math.random() * h];
  }

  // -- player fire -----------------------------------------------------------------
  private fireSpread(): void {
    const gs = game.gs;
    const aim = new Phaser.Math.Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle));
    // One bullet straight at the cursor, extras fanned symmetrically.
    const n = 1 + gs.multiLevel;
    const angles = [0];
    for (let k = 1; angles.length < n; k++) {
      angles.push(C.MULTI_SPREAD_DEG * k);
      if (angles.length < n) angles.push(-C.MULTI_SPREAD_DEG * k);
    }
    const muzzleDist = this.gun.displayHeight * C.GUN_PIVOT.y * 0.92;
    play("shoot");
    for (const deg of angles) {
      const d = aim.clone().rotate(Phaser.Math.DegToRad(deg));
      const side = d.clone().rotate(Math.PI / 2).scale(this.muzzleAlt * this.gun.displayWidth * 0.16);
      this.muzzleAlt *= -1;
      const start = this.towerPos.clone().add(d.clone().scale(muzzleDist)).add(side);
      const dot = this.fx(this.add.circle(start.x, start.y, gs.playerBulletRadius(), 0xffe9a8));
      this.bullets.push({
        dot, vx: d.x * C.BULLET_SPEED, vy: d.y * C.BULLET_SPEED,
        damage: gs.playerDamage(), radius: gs.playerBulletRadius(),
        pierce: gs.pierceLevel, guided: gs.guidedOwned, hit: new Set(), alive: true,
      });
      const flash = this.fx(this.add.circle(start.x, start.y, 9, 0xfff6da, 0.9));
      this.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 70, onComplete: () => flash.destroy() });
    }
  }

  /** Guided Rounds: bend velocity a little toward the nearest enemy in range. */
  private steerBullet(b: Bullet, dt: number): void {
    let best: Enemy | null = null;
    let bestD = C.GUIDED_RANGE;
    for (const e of this.enemies) {
      const d = Math.hypot(e.sprite.x - b.dot.x, e.sprite.y - b.dot.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (!best) return;
    const want = Math.atan2(best.sprite.y - b.dot.y, best.sprite.x - b.dot.x);
    const cur = Math.atan2(b.vy, b.vx);
    const maxTurn = Phaser.Math.DegToRad(C.GUIDED_TURN) * dt;
    const turn = Phaser.Math.Angle.Wrap(want - cur);
    const ang = cur + Phaser.Math.Clamp(turn, -maxTurn, maxTurn);
    const speed = Math.hypot(b.vx, b.vy);
    b.vx = Math.cos(ang) * speed;
    b.vy = Math.sin(ang) * speed;
  }

  private hitEnemy(e: Enemy, damage: number): void {
    e.hp -= damage;
    e.flash = game.gs.reduceMotion ? 0 : C.FLASH_TIME;
    if (e.hp <= 0 && e.alive) this.kill(e);
  }

  /** Explosive Rounds: splash around the struck enemy + a visible shockwave.
   * Radius and damage both grow per level; every victim shows a damage number
   * so the blast visibly DOES something. */
  private explode(at: Phaser.Math.Vector2, exclude: Enemy): void {
    const gs = game.gs;
    if (gs.explosiveLevel <= 0) return;
    const dmg = C.EXPLOSIVE_SPLASH_DMG + C.EXPLOSIVE_SPLASH_PER_LEVEL * (gs.explosiveLevel - 1);
    const radius = C.EXPLOSIVE_RADIUS_BASE + C.EXPLOSIVE_RADIUS_PER_LEVEL * (gs.explosiveLevel - 1);
    for (const e of this.enemies) {
      if (e === exclude || !e.alive) continue;
      if (Math.hypot(e.sprite.x - at.x, e.sprite.y - at.y) <= radius) {
        this.popup(e.sprite.x, e.sprite.y - 14, `-${dmg}`, "#ff9341");
        this.hitEnemy(e, dmg);
      }
    }
    const ring = this.fx(this.add.circle(at.x, at.y, 6).setStrokeStyle(3, 0xff9341, 0.9));
    this.tweens.add({
      targets: ring, radius, alpha: 0, duration: 300,
      onUpdate: () => ring.setStrokeStyle(2, 0xff9341, ring.alpha * 0.9),
      onComplete: () => ring.destroy(),
    });
  }

  private kill(e: Enemy): void {
    e.alive = false;
    const boss = e.type === C.BOSS;
    const { gain, bonus } = game.gs.onKill(e.type.reward, boss);
    play(boss ? "boom" : "kill");
    this.popup(e.sprite.x, e.sprite.y, `+${gain}`, "#ffc94a");
    if (bonus === "cash") this.popup(e.sprite.x, e.sprite.y - 18, `BONUS +${C.DROP_CASH}`, "#ffc94a");
    if (bonus === "heal") this.popup(e.sprite.x, e.sprite.y - 18, `REPAIRED +${C.DROP_HEAL}`, "#46e39a");
    if (bonus === "rapid") this.popup(e.sprite.x, e.sprite.y - 18, "RAPID FIRE!", "#ff9341");
    this.burst(e.sprite.x, e.sprite.y, boss ? 22 : 8);
    if (!game.gs.reduceMotion) this.cameras.main.shake(boss ? 260 : 90, boss ? 0.012 : 0.004);
    e.sprite.destroy();
    e.hpBar?.destroy();
  }

  private burst(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 30;
      const p = this.fx(this.add.circle(x, y, 3, 0xff9341));
      this.tweens.add({
        targets: p, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
        alpha: 0, duration: 320, onComplete: () => p.destroy(),
      });
    }
  }

  private popup(x: number, y: number, text: string, color: string): void {
    const t = this.fx(this.add.text(x, y, text, {
      fontFamily: "Chakra Petch", fontSize: "15px", color, stroke: "#04080f", strokeThickness: 3,
    })).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  // -- drone + auto-shooter ----------------------------------------------------
  private updateDrone(dt: number, enemyDt: number): void {
    const gs = game.gs;
    if (gs.droneLevel <= 0) return;
    if (!this.drone) {
      this.drone = this.add.image(this.towerPos.x, this.towerPos.y - C.DRONE_ORBIT_RADIUS, "drone");
      this.drone.setScale((C.DRONE_RADIUS * 2 * 1.76 * 0.8) / this.drone.width);
    }
    const range = C.DRONE_BASE_RANGE + C.DRONE_RANGE_PER_LEVEL * (gs.droneLevel - 1);
    // Hunt the strongest enemy; orbit the tower when idle.
    let target: Enemy | null = null;
    for (const e of this.enemies) if (!target || e.maxHp > target.maxHp) target = e;
    let want: Phaser.Math.Vector2;
    if (target) {
      const toT = new Phaser.Math.Vector2(target.sprite.x - this.towerPos.x, target.sprite.y - this.towerPos.y).normalize();
      const sideway = new Phaser.Math.Vector2(-toT.y, toT.x).scale(C.DRONE_STANDOFF);
      want = new Phaser.Math.Vector2(target.sprite.x, target.sprite.y)
        .subtract(toT.clone().scale(C.DRONE_STANDOFF)).add(sideway.scale(0.4));
    } else {
      this.droneAngle += Phaser.Math.DegToRad(C.DRONE_ORBIT_SPEED) * dt;
      want = new Phaser.Math.Vector2(
        this.towerPos.x + Math.cos(this.droneAngle) * C.DRONE_ORBIT_RADIUS,
        this.towerPos.y + Math.sin(this.droneAngle) * C.DRONE_ORBIT_RADIUS,
      );
    }
    const d = want.clone().subtract(new Phaser.Math.Vector2(this.drone.x, this.drone.y));
    const dist = d.length();
    const step = Math.min(dist, C.DRONE_SPEED * dt);
    if (dist > 1) {
      this.drone.x += (d.x / dist) * step;
      this.drone.y += (d.y / dist) * step;
      this.drone.setRotation(Math.atan2(d.y, d.x) + Math.PI / 2);
    }
    // Fire at up to 1 (or 2 with Twin Targeting) enemies in range.
    this.droneFireTimer -= enemyDt > 0 ? dt : 0; // drone is the player's: real dt
    if (this.droneFireTimer <= 0) {
      const inRange = this.enemies
        .filter((e) => Math.hypot(e.sprite.x - this.drone!.x, e.sprite.y - this.drone!.y) <= range)
        .sort((a, b) => b.maxHp - a.maxHp)
        .slice(0, gs.twinOwned ? 2 : 1);
      if (inRange.length) {
        const dmg = C.DRONE_DAMAGE + C.DRONE_DAMAGE_PER_LEVEL * (gs.droneLevel - 1);
        for (const e of inRange) {
          this.zap(this.drone.x, this.drone.y, e.sprite.x, e.sprite.y, 0x7fe8ff);
          this.hitEnemy(e, dmg);
        }
        this.droneFireTimer = C.DRONE_BASE_CD * Math.pow(C.DRONE_CD_FACTOR, gs.droneLevel - 1);
      }
    }
    // Field Medic: while the drone has nothing in firing range (flying,
    // repositioning, or a clear field), it patches the tower instead.
    if (gs.medicOwned && gs.hp < gs.maxHp()) {
      const dr = this.drone;
      const nearestE = this.enemies.reduce((d, e) =>
        Math.min(d, Math.hypot(e.sprite.x - dr.x, e.sprite.y - dr.y)), Infinity);
      if (nearestE > range) {
        gs.hp = Math.min(gs.maxHp(), gs.hp + C.MEDIC_HPS * dt);
        this.medicPulse -= dt;
        if (this.medicPulse <= 0) {
          this.zap(this.drone.x, this.drone.y, this.towerPos.x, this.towerPos.y, 0x46e39a);
          this.medicPulse = 0.5;
        }
      }
    }
  }

  private updateAutoShooter(dt: number): void {
    const gs = game.gs;
    if (gs.autoLevel <= 0) return;
    this.autoFireTimer -= dt;
    if (this.autoFireTimer > 0) return;
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(e.sprite.x - this.towerPos.x, e.sprite.y - this.towerPos.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (!best) return;
    this.zap(this.towerPos.x, this.towerPos.y, best.sprite.x, best.sprite.y, 0xffc94a);
    this.hitEnemy(best, C.AUTO_BULLET_DAMAGE);
    this.autoFireTimer = C.AUTO_BASE_COOLDOWN / gs.autoLevel;
  }

  private zap(x1: number, y1: number, x2: number, y2: number, color: number): void {
    const line = this.fx(this.add.line(0, 0, x1, y1, x2, y2, color, 0.8)).setOrigin(0).setLineWidth(1.5);
    this.tweens.add({ targets: line, alpha: 0, duration: 90, onComplete: () => line.destroy() });
  }

  // -- ultimates ------------------------------------------------------------------
  private fireUltimate(): void {
    const gs = game.gs;
    const key = gs.equippedUltimate;
    if (!key || this.paused || this.over || this.cooldowns[key] > 0) return;
    if (key === "freeze") {
      this.freezeActive = C.FREEZE_DURATION;
      this.cooldowns.freeze = C.FREEZE_COOLDOWN;
      play("shield");
      this.flashScreen(0x7fe8ff, 0.18);
    } else if (key === "emp") {
      // Instant damage to EVERYTHING + fries projectiles; brief pulse stun.
      if (this.enemyBullets.length >= 5) gs.unlockAchievement("emp_fry");
      for (const eb of this.enemyBullets) eb.dot.destroy();
      this.enemyBullets = [];
      for (const e of [...this.enemies]) this.hitEnemy(e, C.EMP_DAMAGE);
      this.stunActive = C.EMP_STUN;
      this.cooldowns.emp = C.EMP_COOLDOWN;
      play("boom");
      this.flashScreen(0x3b9dff, 0.22);
    } else if (key === "warp") {
      this.warpActive = C.WARP_DURATION;
      this.cooldowns.warp = C.WARP_COOLDOWN;
      play("buy");
      this.flashScreen(0x46e39a, 0.14);
    } else if (key === "laser") {
      this.laserActive = C.LASER_DURATION;
      this.cooldowns.laser = C.LASER_COOLDOWN;
      play("laser");
    }
  }

  private updateLaser(dt: number): void {
    if (this.laserActive <= 0) return;
    this.laserActive -= dt;
    const aim = new Phaser.Math.Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle));
    const end = this.towerPos.clone().add(aim.clone().scale(2000));
    const beam = this.fx(this.add.line(0, 0, this.towerPos.x, this.towerPos.y, end.x, end.y, 0xffffff, 0.9))
      .setOrigin(0).setLineWidth(C.LASER_WIDTH / 8);
    const glow = this.fx(this.add.line(0, 0, this.towerPos.x, this.towerPos.y, end.x, end.y, 0x7fe8ff, 0.35))
      .setOrigin(0).setLineWidth(C.LASER_WIDTH / 3);
    this.time.delayedCall(40, () => { beam.destroy(); glow.destroy(); });
    // Damage every enemy near the beam line.
    for (const e of [...this.enemies]) {
      const toE = new Phaser.Math.Vector2(e.sprite.x - this.towerPos.x, e.sprite.y - this.towerPos.y);
      const along = toE.dot(aim);
      if (along < 0) continue;
      const perp = Math.abs(toE.x * aim.y - toE.y * aim.x);
      if (perp <= C.LASER_WIDTH / 2 + e.type.radius) {
        if (e.type === C.GRUNT || e.type === C.FAST) this.kill(e); // vaporized
        else this.hitEnemy(e, C.LASER_DPS * dt);
      }
    }
  }

  /** Touch feedback: anchor ring + drag knob at the thumb. */
  private drawJoystick(p: Phaser.Input.Pointer): void {
    this.joyGfx.clear();
    if (!this.joyOrigin) return;
    const o = this.joyOrigin;
    this.joyGfx.lineStyle(2, 0x7fe8ff, 0.28).strokeCircle(o.x, o.y, 26);
    const d = new Phaser.Math.Vector2(p.worldX - o.x, p.worldY - o.y);
    const len = Math.min(d.length(), 34);
    if (len > 2) {
      const k = d.normalize().scale(len);
      this.joyGfx.fillStyle(0x7fe8ff, 0.45).fillCircle(o.x + k.x, o.y + k.y, 11);
    }
  }

  private flashScreen(color: number, alpha: number): void {
    if (game.gs.reduceMotion) return;
    const r = this.fx(this.add.rectangle(game.world.w / 2, game.world.h / 2, game.world.w, game.world.h, color, alpha));
    this.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
  }

  private drawBackdrop(): void {
    // (The page draws the gradient + grid full-bleed; only the tower-relative
    // range rings live in-world.)
    for (let i = 1; i <= 5; i++) {
      const ring = this.add.graphics();
      ring.lineStyle(1, 0x3b9dff, 0.10 - i * 0.015);
      ring.strokeCircle(this.towerPos.x, this.towerPos.y, 90 * i);
    }
  }

  private drawShield(): void {
    const gs = game.gs;
    this.shieldGfx.clear();
    // One ring per remaining layer; outermost brightest (matches the original).
    for (let i = 0; i < gs.shield; i++) {
      const r = C.SHIELD_RING_BASE + C.SHIELD_RING_GAP * i;
      const outer = i === gs.shield - 1;
      this.shieldGfx.lineStyle(outer ? 2 : 1, outer ? 0xc8f0ff : 0x7fe8ff, outer ? 0.9 : 0.45);
      this.shieldGfx.strokeCircle(this.towerPos.x, this.towerPos.y, r);
    }
  }

  // -- main loop ---------------------------------------------------------------------
  update(_time: number, deltaMs: number) {
    const gs = game.gs;
    const dt = Math.min(deltaMs / 1000, C.MAX_DT);
    if (this.paused || this.over) { this.pushHud(); return; }

    gs.tick(dt);
    for (const k of Object.keys(this.cooldowns) as C.UltimateKey[]) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] -= dt;
    }
    if (this.freezeActive > 0) this.freezeActive -= dt;
    if (this.stunActive > 0) this.stunActive -= dt;
    if (this.warpActive > 0) this.warpActive -= dt;

    const frozen = this.freezeActive > 0 || this.stunActive > 0;
    const enemyDt = frozen ? 0 : dt * (this.warpActive > 0 ? C.WARP_FACTOR : 1);

    if (this.intermission > 0) {
      this.intermission -= dt;
    } else {
      if (this.toSpawn > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnOne();
          this.toSpawn -= 1;
          this.spawnTimer = waveSpawnInterval(gs.wave);
        }
      } else if (this.enemies.length === 0) {
        this.waveCleared();
        this.pushHud();
        return;
      }
      const p = this.input.activePointer;
      if (this.joyOrigin) {
        const dx = p.worldX - this.joyOrigin.x;
        const dy = p.worldY - this.joyOrigin.y;
        if (dx * dx + dy * dy > 14 * 14) this.aimAngle = Math.atan2(dy, dx);
      } else if (!p.wasTouch) {
        this.aimAngle = Phaser.Math.Angle.Between(this.towerPos.x, this.towerPos.y, p.worldX, p.worldY);
      }
      this.gun.setRotation(this.aimAngle + Math.PI / 2);
      this.fireTimer -= dt;
      if (this.mouseHeld && this.fireTimer <= 0) {
        this.fireSpread();
        this.fireTimer = gs.playerCooldown();
      }
      this.drawJoystick(p);
      this.updateAutoShooter(dt);
      this.updateDrone(dt, enemyDt);
      this.updateLaser(dt);
    }

    // Enemies advance; crash on the shield ring (or the tower itself).
    for (const e of this.enemies) {
      if (e.flash > 0) { e.flash -= dt; e.sprite.setTintFill(0xffffff); }
      else e.sprite.clearTint();
      const dx = this.towerPos.x - e.sprite.x;
      const dy = this.towerPos.y - e.sprite.y;
      const dist = Math.hypot(dx, dy);
      const ranged = e.type.ranged;
      if (ranged && dist <= ranged.fireRange) {
        e.fireTimer -= enemyDt;
        if (e.fireTimer <= 0 && enemyDt > 0) {
          const dot = this.fx(this.add.circle(e.sprite.x, e.sprite.y, C.ENEMY_BULLET_RADIUS, 0xff5238));
          this.enemyBullets.push({
            dot, vx: (dx / dist) * C.ENEMY_BULLET_SPEED, vy: (dy / dist) * C.ENEMY_BULLET_SPEED,
            damage: ranged.projDamage, alive: true,
          });
          e.fireTimer = ranged.fireCd;
        }
      } else if (dist > 0 && enemyDt > 0) {
        e.sprite.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
        e.sprite.x += (dx / dist) * e.speed * enemyDt;
        e.sprite.y += (dy / dist) * e.speed * enemyDt;
      }
      const crashAt = gs.shield > 0 ? gs.shieldRadius() + e.type.radius : e.type.radius + C.TOWER_SIZE / 2;
      if (!ranged && dist <= crashAt) {
        let dmg = e.type.contactDamage;
        if (e.type === C.BOSS) dmg = Math.max(dmg, Math.floor(gs.maxHp() * 0.9));
        const res = gs.damageTower(dmg);
        play(res.layersSpent > 0 ? "shield" : "hit");
        if (!gs.reduceMotion) this.cameras.main.shake(140, res.layersSpent && !res.hpLost ? 0.005 : 0.009);
        e.alive = false;
        e.sprite.destroy(); e.hpBar?.destroy();
        if (res.died) { this.towerDestroyed(); return; }
      }
      if (e.alive && e.type.healthbar) {
        e.hpBar ??= this.add.graphics();
        e.hpBar.clear();
        const w = e.type.radius * 2;
        e.hpBar.fillStyle(0x0a1424, 0.8).fillRect(e.sprite.x - w / 2, e.sprite.y - e.type.radius - 12, w, 5);
        e.hpBar.fillStyle(0x46e39a, 1).fillRect(e.sprite.x - w / 2, e.sprite.y - e.type.radius - 12, w * Math.max(0, e.hp / e.maxHp), 5);
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    // Interceptor: the drone swats projectiles that enter its range.
    if (this.drone && gs.interceptorOwned && this.enemyBullets.length) {
      this.interceptTimer -= dt;
      if (this.interceptTimer <= 0) {
        const range = C.DRONE_BASE_RANGE + C.DRONE_RANGE_PER_LEVEL * (gs.droneLevel - 1);
        const target = this.enemyBullets.find((eb) =>
          eb.alive && Math.hypot(eb.dot.x - this.drone!.x, eb.dot.y - this.drone!.y) <= range);
        if (target) {
          this.zap(this.drone.x, this.drone.y, target.dot.x, target.dot.y, 0x7fe8ff);
          const flash = this.fx(this.add.circle(target.dot.x, target.dot.y, 7, 0xffe9a8, 0.9));
          this.tweens.add({ targets: flash, alpha: 0, scale: 1.6, duration: 120, onComplete: () => flash.destroy() });
          target.alive = false;
          target.dot.destroy();
          play("shoot");
          this.interceptTimer = C.INTERCEPT_CD;
        }
      }
    }

    // Enemy projectiles -> shield ring or tower.
    for (const eb of this.enemyBullets) {
      eb.dot.x += eb.vx * enemyDt;
      eb.dot.y += eb.vy * enemyDt;
      const dist = Math.hypot(eb.dot.x - this.towerPos.x, eb.dot.y - this.towerPos.y);
      const hit = gs.shield > 0 ? dist <= gs.shieldRadius() : dist <= C.TOWER_SIZE / 2 + C.ENEMY_BULLET_RADIUS;
      if (hit) {
        const res = gs.damageTower(eb.damage);
        play(res.layersSpent > 0 ? "shield" : "hit");
        if (!gs.reduceMotion) this.cameras.main.shake(100, 0.005);
        eb.alive = false; eb.dot.destroy();
        if (res.died) { this.towerDestroyed(); return; }
      }
    }
    this.enemyBullets = this.enemyBullets.filter((b) => b.alive);

    // Player bullets: steer, travel, pierce, splash.
    for (const b of this.bullets) {
      if (b.guided) this.steerBullet(b, dt);
      b.dot.x += b.vx * dt;
      b.dot.y += b.vy * dt;
      if (b.dot.x < -20 || b.dot.x > game.world.w + 20 || b.dot.y < -20 || b.dot.y > game.world.h + 20) {
        b.alive = false; b.dot.destroy(); continue;
      }
      for (const e of this.enemies) {
        if (b.hit.has(e)) continue;
        const d = Math.hypot(e.sprite.x - b.dot.x, e.sprite.y - b.dot.y);
        if (d <= e.type.radius + b.radius) {
          const at = new Phaser.Math.Vector2(e.sprite.x, e.sprite.y);
          this.hitEnemy(e, b.damage);
          this.explode(at, e);
          b.hit.add(e);
          if (b.pierce > 0) { b.pierce -= 1; } else { b.alive = false; b.dot.destroy(); }
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.alive);

    this.drawShield();
    this.pushHud();
  }

  private pushHud(): void {
    const gs = game.gs;
    const key = gs.equippedUltimate;
    this.onHud({
      level: gs.level, waveInLevel: waveInLevel(gs.wave), wavesInLevel: wavesForLevel(gs.level),
      hp: gs.hp, maxHp: gs.maxHp(), money: gs.money, cores: gs.cores,
      shield: gs.shield, combo: gs.combo, comboMult: gs.comboMult(),
      intermission: this.intermission,
      ultimate: key ? {
        key, name: C.ULTIMATE_NAMES[key],
        ready: this.cooldowns[key] <= 0, cooldown: Math.max(0, this.cooldowns[key]),
      } : null,
      rapid: gs.rapidTimer > 0,
    });
  }
}
