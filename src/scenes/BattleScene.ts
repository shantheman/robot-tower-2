/** The battle scene: tower + swiveling gun, waves of enemies, hold-click
 * shooting. Mechanics ported from the original game.py (v0.7.0); visuals per
 * docs/design/HANDOFF.md (turret rig pivots, palette, range rings).
 *
 * The HUD is NOT drawn here — it's a DOM/CSS overlay (src/ui/hud.ts) that this
 * scene feeds via the onHud callback. UI in HTML, war in WebGL.
 */

import Phaser from "phaser";
import {
  BASE_SOCKET, BULLET_DAMAGE, BULLET_RADIUS, BULLET_SPEED, BOSS, COMBO_BONUS_MAX,
  COMBO_BONUS_PER, COMBO_WINDOW, EnemyType, FIRE_COOLDOWN, GUN_PIVOT,
  HEAVY_HP_RAMP, INTERMISSION_TIME, LEVEL_CLEAR_CORES, SPAWN_MARGIN,
  TOWER_MAX_HP, TOWER_SIZE, WAVE_CLEAR_CORES, WORLD_H, WORLD_W,
} from "../config";
import {
  chooseEnemyType, effectiveWave, isBossWave, levelStartWave, waveInLevel,
  waveRobotCount, waveRobotSpeed, waveSpawnInterval, wavesForLevel,
} from "../sim/waves";

export interface HudState {
  level: number; waveInLevel: number; wavesInLevel: number;
  hp: number; maxHp: number; money: number; cores: number;
  intermission: number; // >0 -> wave-intro countdown showing
}

interface Enemy {
  sprite: Phaser.GameObjects.Image;
  hpBar?: Phaser.GameObjects.Graphics;
  type: EnemyType;
  hp: number; maxHp: number; speed: number;
  alive: boolean;
}

interface Bullet {
  dot: Phaser.GameObjects.Arc;
  vx: number; vy: number;
  alive: boolean;
}

export class BattleScene extends Phaser.Scene {
  private onHud!: (s: HudState) => void;

  private towerPos = new Phaser.Math.Vector2(WORLD_W / 2, WORLD_H / 2);
  private gun!: Phaser.GameObjects.Image;
  private hp = TOWER_MAX_HP;
  private maxHp = TOWER_MAX_HP;

  private level = 1;
  private wave = 1;            // global wave number
  private money = 0;
  private cores = 0;
  private combo = 0;
  private comboTimer = 0;

  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private toSpawn = 0;
  private spawnTimer = 0;
  private bossPending = false;
  private intermission = INTERMISSION_TIME;
  private fireTimer = 0;
  private mouseHeld = false;
  private muzzleAlt = 1; // alternate barrels

  constructor() { super("battle"); }

  init(data: { onHud: (s: HudState) => void }) { this.onHud = data.onHud; }

  preload() {
    this.load.image("turret_base", "sprites/turret_base.png");
    this.load.image("turret_gun", "sprites/turret_gun.png");
    for (const k of ["enemy_0", "enemy_1", "enemy_2", "enemy_3", "enemy_4", "boss", "shooter"]) {
      this.load.image(k, `sprites/${k}.png`);
    }
  }

  create() {
    this.drawBackdrop();

    // Turret rig (HANDOFF spec): base's (50%,43%) socket sits at the tower
    // position; the gun rotates around its own (50%,79%) pivot at that point.
    const base = this.add.image(0, 0, "turret_base").setOrigin(BASE_SOCKET.x, BASE_SOCKET.y);
    base.setPosition(this.towerPos.x, this.towerPos.y);
    const targetBaseW = TOWER_SIZE * 2.3; // visual size tuned to the mock
    base.setScale(targetBaseW / base.width);
    this.gun = this.add.image(this.towerPos.x, this.towerPos.y, "turret_gun")
      .setOrigin(GUN_PIVOT.x, GUN_PIVOT.y);
    this.gun.setScale((TOWER_SIZE * 2.0) / this.gun.width);

    this.input.on("pointerdown", () => { this.mouseHeld = true; });
    this.input.on("pointerup", () => { this.mouseHeld = false; });

    this.startWave();
  }

  private drawBackdrop() {
    // Grid, masked radially (mock: 48px lines at 6% blue, fading outward).
    const g = this.add.graphics();
    g.lineStyle(1, 0x6096e6, 0.06);
    for (let x = 0; x <= WORLD_W; x += 48) g.lineBetween(x, 0, x, WORLD_H);
    for (let y = 0; y <= WORLD_H; y += 48) g.lineBetween(0, y, WORLD_W, y);
    // Concentric range rings radiating from the tower, fading with distance.
    for (let i = 1; i <= 5; i++) {
      const ring = this.add.graphics();
      ring.lineStyle(1, 0x3b9dff, 0.10 - i * 0.015);
      ring.strokeCircle(this.towerPos.x, this.towerPos.y, 90 * i);
    }
  }

  // -- wave flow --------------------------------------------------------------
  private startWave() {
    this.intermission = INTERMISSION_TIME;
    this.toSpawn = waveRobotCount(this.wave);
    this.bossPending = isBossWave(this.wave);
    this.spawnTimer = 0;
  }

  private spawnOne() {
    const type = this.bossPending ? BOSS : chooseEnemyType(this.wave);
    if (this.bossPending) this.bossPending = false;
    const [x, y] = this.edgePosition();
    const sprite = this.add.image(x, y, type.sprite);
    sprite.setScale((type.radius * 2.6) / sprite.width);
    const ew = effectiveWave(this.wave);
    const hp = type.levelScaled ? type.hp * (1 + HEAVY_HP_RAMP * (ew - 1)) : type.hp;
    this.enemies.push({
      sprite, type, hp, maxHp: hp, alive: true,
      speed: waveRobotSpeed(this.wave) * type.speedMult,
    });
  }

  private edgePosition(): [number, number] {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return [Math.random() * WORLD_W, -SPAWN_MARGIN];
    if (side === 1) return [Math.random() * WORLD_W, WORLD_H + SPAWN_MARGIN];
    if (side === 2) return [-SPAWN_MARGIN, Math.random() * WORLD_H];
    return [WORLD_W + SPAWN_MARGIN, Math.random() * WORLD_H];
  }

  private waveCleared() {
    // v0.7.0 cores model: every cleared wave pays level x rate, instantly.
    this.cores += WAVE_CLEAR_CORES * this.level;
    if (isBossWave(this.wave)) {
      this.cores += LEVEL_CLEAR_CORES * this.level; // level-clear bonus
      this.level += 1;
      this.wave = levelStartWave(this.level);
    } else {
      this.wave += 1;
    }
    // (The between-waves shop comes in the next port phase — for the visual
    // slice, waves roll straight on after the intro countdown.)
    this.startWave();
  }

  // -- combat -----------------------------------------------------------------
  private fire(pointer: Phaser.Input.Pointer) {
    const aim = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY).subtract(this.towerPos);
    if (aim.lengthSq() === 0) return;
    aim.normalize();
    // Bullet leaves from the barrel tips (alternating), at the gun's muzzle.
    const muzzleDist = this.gun.displayHeight * GUN_PIVOT.y * 0.92;
    const side = aim.clone().rotate(Math.PI / 2).scale(this.muzzleAlt * this.gun.displayWidth * 0.16);
    this.muzzleAlt *= -1;
    const start = this.towerPos.clone().add(aim.clone().scale(muzzleDist)).add(side);
    const dot = this.add.circle(start.x, start.y, BULLET_RADIUS, 0xffe9a8);
    this.bullets.push({ dot, vx: aim.x * BULLET_SPEED, vy: aim.y * BULLET_SPEED, alive: true });
    // Muzzle flash
    const flash = this.add.circle(start.x, start.y, 9, 0xfff6da, 0.9);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 70, onComplete: () => flash.destroy() });
  }

  private comboMult(): number {
    return 1 + Math.min(COMBO_BONUS_MAX, COMBO_BONUS_PER * Math.max(0, this.combo - 1));
  }

  private kill(e: Enemy) {
    e.alive = false;
    this.combo += 1;
    this.comboTimer = COMBO_WINDOW;
    this.money += Math.round(e.type.reward * this.comboMult());
    // Burst of shards in the enemy's palette slot (simple placeholder juice).
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const p = this.add.circle(e.sprite.x, e.sprite.y, 3, 0xff9341);
      this.tweens.add({
        targets: p, x: e.sprite.x + Math.cos(a) * 40, y: e.sprite.y + Math.sin(a) * 40,
        alpha: 0, duration: 320, onComplete: () => p.destroy(),
      });
    }
    e.sprite.destroy();
    e.hpBar?.destroy();
  }

  // -- main loop ----------------------------------------------------------------
  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.05); // same MAX_DT clamp as the original

    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }

    if (this.intermission > 0) {
      this.intermission -= dt;
    } else {
      // Spawning
      if (this.toSpawn > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnOne();
          this.toSpawn -= 1;
          this.spawnTimer = waveSpawnInterval(this.wave);
        }
      } else if (this.enemies.length === 0) {
        this.waveCleared();
      }

      // Gun aim + fire (manual aim: the gun tracks the cursor, exactly like
      // the original — the mock's auto-targeting was visual-only).
      const p = this.input.activePointer;
      const ang = Phaser.Math.Angle.Between(this.towerPos.x, this.towerPos.y, p.worldX, p.worldY);
      this.gun.setRotation(ang + Math.PI / 2); // sprite faces up at 0
      this.fireTimer -= dt;
      if (this.mouseHeld && this.fireTimer <= 0) {
        this.fire(p);
        this.fireTimer = FIRE_COOLDOWN;
      }
    }

    // Enemies advance and crash
    for (const e of this.enemies) {
      const dx = this.towerPos.x - e.sprite.x;
      const dy = this.towerPos.y - e.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        e.sprite.setRotation(Math.atan2(dy, dx) + Math.PI / 2); // sprites face up
        e.sprite.x += (dx / dist) * e.speed * dt;
        e.sprite.y += (dy / dist) * e.speed * dt;
      }
      if (dist <= e.type.radius + TOWER_SIZE / 2) {
        let dmg = e.type.contactDamage;
        if (e.type === BOSS) dmg = Math.max(dmg, Math.floor(this.maxHp * 0.9));
        this.hp = Math.max(0, this.hp - dmg);
        this.cameras.main.shake(120, 0.008);
        e.alive = false;
        e.sprite.destroy(); e.hpBar?.destroy();
      }
      // Health bars for the big ones
      if (e.alive && e.type.healthbar) {
        e.hpBar ??= this.add.graphics();
        e.hpBar.clear();
        const w = e.type.radius * 2;
        e.hpBar.fillStyle(0x0a1424, 0.8).fillRect(e.sprite.x - w / 2, e.sprite.y - e.type.radius - 12, w, 5);
        e.hpBar.fillStyle(0x46e39a, 1).fillRect(e.sprite.x - w / 2, e.sprite.y - e.type.radius - 12, w * (e.hp / e.maxHp), 5);
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    // Bullets travel and hit
    for (const b of this.bullets) {
      b.dot.x += b.vx * dt;
      b.dot.y += b.vy * dt;
      if (b.dot.x < -20 || b.dot.x > WORLD_W + 20 || b.dot.y < -20 || b.dot.y > WORLD_H + 20) {
        b.alive = false; b.dot.destroy(); continue;
      }
      for (const e of this.enemies) {
        const d = Math.hypot(e.sprite.x - b.dot.x, e.sprite.y - b.dot.y);
        if (d <= e.type.radius + BULLET_RADIUS) {
          e.hp -= BULLET_DAMAGE;
          b.alive = false; b.dot.destroy();
          if (e.hp <= 0) this.kill(e);
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.alive);

    this.onHud({
      level: this.level, waveInLevel: waveInLevel(this.wave),
      wavesInLevel: wavesForLevel(this.level),
      hp: this.hp, maxHp: this.maxHp, money: this.money, cores: this.cores,
      intermission: this.intermission,
    });
  }
}
