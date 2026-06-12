/** Transient battle juice — zaps, bursts, damage popups, screen flashes.
 * Everything goes through track() into one layer so startBattle can
 * hard-clear leftovers (manual sys.step driving taught us why: tweens
 * that never tick leave garbage on the field). */

import Phaser from "phaser";
import { game } from "../game";

export class Effects {
  readonly layer: Phaser.GameObjects.Layer;

  constructor(private scene: Phaser.Scene) {
    this.layer = scene.add.layer();
  }

  /** Track a transient object so clear() can sweep it. */
  track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.layer.add(obj);
    return obj;
  }

  clear(): void {
    this.layer.removeAll(true);
  }

  zap(x1: number, y1: number, x2: number, y2: number, color: number): void {
    const line = this.track(this.scene.add.line(0, 0, x1, y1, x2, y2, color, 0.8))
      .setOrigin(0).setLineWidth(1.5);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: 90, onComplete: () => line.destroy() });
  }

  burst(x: number, y: number, n: number): void {
    const big = n > 12; // boss tier

    // Central flash — bright yellow-white, expands and vanishes fast
    const flash = this.track(this.scene.add.circle(x, y, big ? 28 : 18, 0xfffce0));
    this.scene.tweens.add({
      targets: flash, scaleX: big ? 4 : 3.2, scaleY: big ? 4 : 3.2, alpha: 0,
      duration: 200, ease: "Power2", onComplete: () => flash.destroy(),
    });

    // Fireball — orange core that expands more slowly
    const fireball = this.track(this.scene.add.circle(x, y, big ? 22 : 14, 0xff5500));
    this.scene.tweens.add({
      targets: fireball, scaleX: big ? 4.5 : 3.2, scaleY: big ? 4.5 : 3.2, alpha: 0,
      duration: 480, ease: "Power2", onComplete: () => fireball.destroy(),
    });

    // Shockwave ring — expands quickly and fades
    const ring = this.track(this.scene.add.graphics());
    const rs = { r: 6, a: 0.72 };
    const maxR = big ? 80 : 52;
    this.scene.tweens.add({
      targets: rs, r: maxR, a: 0, duration: 420, ease: "Power1",
      onUpdate: () => ring.clear().lineStyle(2.5, 0xff9833, rs.a).strokeCircle(x, y, rs.r),
      onComplete: () => ring.destroy(),
    });

    // Embers — denser, varied sizes and colors, slight delay stagger
    const EMBER = [0xffe566, 0xff9341, 0xff6600, 0xffcc22, 0xff3300, 0xffee88];
    const spread = big ? 110 : 72;
    for (let i = 0; i < n * 2; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = spread * (0.35 + Math.random() * 0.65);
      const sz = 2 + Math.random() * (big ? 5 : 3.5);
      const p = this.track(this.scene.add.circle(x, y, sz, EMBER[Math.floor(Math.random() * EMBER.length)]));
      this.scene.tweens.add({
        targets: p, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
        alpha: 0, duration: 380 + Math.random() * 360, delay: Math.random() * 70,
        ease: "Power1", onComplete: () => p.destroy(),
      });
    }

    // Smoke puffs — dark, drift upward, linger
    const smokeN = Math.max(3, Math.round(n / 3));
    for (let i = 0; i < smokeN; i++) {
      const a = Math.random() * Math.PI * 2;
      const sr = (big ? 12 : 8) * Math.random();
      const sx = x + Math.cos(a) * sr, sy = y + Math.sin(a) * sr;
      const smoke = this.track(this.scene.add.circle(sx, sy, 7 + Math.random() * (big ? 11 : 7), 0x3a2800, 0.5));
      this.scene.tweens.add({
        targets: smoke,
        x: sx + Math.cos(a) * (big ? 48 : 32), y: sy + Math.sin(a) * (big ? 48 : 32) - (big ? 22 : 14),
        scaleX: big ? 3.8 : 2.8, scaleY: big ? 3.8 : 2.8,
        alpha: 0, duration: 850 + Math.random() * 450, delay: 55,
        ease: "Power1", onComplete: () => smoke.destroy(),
      });
    }
  }

  popup(x: number, y: number, text: string, color: string): void {
    const t = this.track(this.scene.add.text(x, y, text, {
      fontFamily: "Chakra Petch", fontSize: "15px", color, stroke: "#04080f", strokeThickness: 3,
    })).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  flashScreen(color: number, alpha: number): void {
    if (game.gs.reduceMotion) return;
    const r = this.track(this.scene.add.rectangle(
      game.world.w / 2, game.world.h / 2, game.world.w, game.world.h, color, alpha));
    this.scene.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
  }
}
