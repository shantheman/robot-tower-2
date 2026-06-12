/** The player's drone: orbit/hunt movement, (twin) targeting, and the two
 * tree powers — Interceptor (swats enemy projectiles) and Field Medic
 * (repairs the tower during lulls). Carved out of BattleScene 2026-06-12;
 * behavior is 1:1 with the original methods. */

import Phaser from "phaser";
import * as C from "../config";
import { game } from "../game";
import { play } from "../audio";
import { Effects } from "./effects";
import { makeSilhouette, shadowOffset } from "./shadows";
import type { Enemy, EnemyBullet } from "./types";

export class DroneController {
  private sprite?: Phaser.GameObjects.Image;
  private shadow?: Phaser.GameObjects.Image;
  private angle = 0;
  private fireTimer = 0;
  private interceptTimer = 0;
  private medicPulse = 0;

  constructor(
    private scene: Phaser.Scene,
    private fx: Effects,
    private shadowLayer: Phaser.GameObjects.Layer,
    private towerPos: Phaser.Math.Vector2,
    private hitEnemy: (e: Enemy, dmg: number) => void,
  ) {}

  /** Destroy the sprites (new run / checkpoint retry). */
  reset(): void {
    this.sprite?.destroy();
    this.sprite = undefined;
    this.shadow?.destroy();
    this.shadow = undefined;
  }

  /** Movement + firing + medic. Runs only while the wave is live (the
   * caller gates on intermission), matching the original updateDrone. */
  update(dt: number, enemyDt: number, enemies: Enemy[]): void {
    const gs = game.gs;
    if (gs.droneLevel <= 0) return;
    if (!this.sprite) {
      this.sprite = this.scene.add.image(
        this.towerPos.x, this.towerPos.y - C.DRONE_ORBIT_RADIUS, "drone");
      this.sprite.setScale((C.DRONE_RADIUS * 2 * C.DRONE_SPRITE_SCALE) / this.sprite.width);
      // The drone flies — same detached silhouette shadow as flying enemies.
      this.shadow = makeSilhouette(
        this.scene, this.shadowLayer, "drone",
        this.sprite.x, this.sprite.y, this.sprite.scale, true);
    }
    const drone = this.sprite;
    const range = C.DRONE_BASE_RANGE + C.DRONE_RANGE_PER_LEVEL * (gs.droneLevel - 1);
    // Hunt the strongest enemy; orbit the tower when idle.
    let target: Enemy | null = null;
    for (const e of enemies) if (!target || e.maxHp > target.maxHp) target = e;
    let want: Phaser.Math.Vector2;
    if (target) {
      const toT = new Phaser.Math.Vector2(
        target.sprite.x - this.towerPos.x, target.sprite.y - this.towerPos.y).normalize();
      const sideway = new Phaser.Math.Vector2(-toT.y, toT.x).scale(C.DRONE_STANDOFF);
      want = new Phaser.Math.Vector2(target.sprite.x, target.sprite.y)
        .subtract(toT.clone().scale(C.DRONE_STANDOFF)).add(sideway.scale(0.4));
    } else {
      this.angle += Phaser.Math.DegToRad(C.DRONE_ORBIT_SPEED) * dt;
      want = new Phaser.Math.Vector2(
        this.towerPos.x + Math.cos(this.angle) * C.DRONE_ORBIT_RADIUS,
        this.towerPos.y + Math.sin(this.angle) * C.DRONE_ORBIT_RADIUS,
      );
    }
    const d = want.clone().subtract(new Phaser.Math.Vector2(drone.x, drone.y));
    const dist = d.length();
    const step = Math.min(dist, C.DRONE_SPEED * dt);
    if (dist > 1) {
      drone.x += (d.x / dist) * step;
      drone.y += (d.y / dist) * step;
      drone.setRotation(Math.atan2(d.y, d.x) + Math.PI / 2);
    }
    if (this.shadow) {
      const off = shadowOffset(C.DRONE_RADIUS, true);
      this.shadow.setPosition(drone.x + off.x, drone.y + off.y);
      this.shadow.setRotation(drone.rotation);
    }
    // Fire at up to 1 (or 2 with Twin Targeting) enemies in range.
    this.fireTimer -= enemyDt > 0 ? dt : 0; // drone is the player's: real dt
    if (this.fireTimer <= 0) {
      const inRange = enemies
        .filter((e) => Math.hypot(e.sprite.x - drone.x, e.sprite.y - drone.y) <= range)
        .sort((a, b) => b.maxHp - a.maxHp)
        .slice(0, gs.twinOwned ? 2 : 1);
      if (inRange.length) {
        const dmg = C.DRONE_DAMAGE + C.DRONE_DAMAGE_PER_LEVEL * (gs.droneLevel - 1);
        for (const e of inRange) {
          this.fx.zap(drone.x, drone.y, e.sprite.x, e.sprite.y, 0x7fe8ff);
          this.hitEnemy(e, dmg);
        }
        this.fireTimer = C.DRONE_BASE_CD * Math.pow(C.DRONE_CD_FACTOR, gs.droneLevel - 1);
      }
    }
    // Field Medic: while the drone has nothing in firing range (flying,
    // repositioning, or a clear field), it patches the tower instead.
    if (gs.medicOwned && gs.hp < gs.maxHp()) {
      const nearestE = enemies.reduce((m, e) =>
        Math.min(m, Math.hypot(e.sprite.x - drone.x, e.sprite.y - drone.y)), Infinity);
      if (nearestE > range) {
        gs.hp = Math.min(gs.maxHp(), gs.hp + C.MEDIC_HPS * dt);
        this.medicPulse -= dt;
        if (this.medicPulse <= 0) {
          this.fx.zap(drone.x, drone.y, this.towerPos.x, this.towerPos.y, 0x46e39a);
          this.medicPulse = 0.5;
        }
      }
    }
  }

  /** Interceptor: swat projectiles in range. Runs every frame (even during
   * the intermission), matching the original block in update(). */
  intercept(dt: number, enemyBullets: EnemyBullet[]): void {
    const gs = game.gs;
    if (!this.sprite || !gs.interceptorOwned || !enemyBullets.length) return;
    const drone = this.sprite;
    this.interceptTimer -= dt;
    if (this.interceptTimer > 0) return;
    const range = C.DRONE_BASE_RANGE + C.DRONE_RANGE_PER_LEVEL * (gs.droneLevel - 1);
    const target = enemyBullets.find((eb) =>
      eb.alive && Math.hypot(eb.dot.x - drone.x, eb.dot.y - drone.y) <= range);
    if (target) {
      this.fx.zap(drone.x, drone.y, target.dot.x, target.dot.y, 0x7fe8ff);
      const flash = this.fx.track(this.scene.add.circle(target.dot.x, target.dot.y, 7, 0xffe9a8, 0.9));
      this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.6, duration: 120, onComplete: () => flash.destroy() });
      target.alive = false;
      target.dot.destroy();
      play("shoot");
      this.interceptTimer = C.INTERCEPT_CD;
    }
  }
}
