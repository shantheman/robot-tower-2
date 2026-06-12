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
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 30;
      const p = this.track(this.scene.add.circle(x, y, 3, 0xff9341));
      this.scene.tweens.add({
        targets: p, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
        alpha: 0, duration: 320, onComplete: () => p.destroy(),
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
