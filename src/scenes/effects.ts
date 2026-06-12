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
    this.ensureParticleTextures();
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

    // Central flash
    const flash = this.track(this.scene.add.circle(x, y, big ? 28 : 18, 0xfffce0));
    this.scene.tweens.add({
      targets: flash, scaleX: big ? 4 : 3.2, scaleY: big ? 4 : 3.2, alpha: 0,
      duration: 200, ease: "Power2", onComplete: () => flash.destroy(),
    });

    // Shockwave ring
    const ring = this.track(this.scene.add.graphics());
    const rs = { r: 6, a: 0.72 };
    this.scene.tweens.add({
      targets: rs, r: big ? 80 : 52, a: 0, duration: 420, ease: "Power1",
      onUpdate: () => ring.clear().lineStyle(2.5, 0xff9833, rs.a).strokeCircle(x, y, rs.r),
      onComplete: () => ring.destroy(),
    });

    // Fire particles — additive blending gives that orange glow against dark backgrounds
    const fire = this.track(this.scene.add.particles(x, y, "pfx_fire", {
      speed: { min: 40, max: big ? 170 : 110 },
      angle: { min: 0, max: 360 },
      scale: { start: big ? 1.6 : 1.0, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 280, max: 520 },
      gravityY: -80,
      blendMode: "ADD",
      emitting: false,
    }));
    fire.explode(big ? 22 : 13);
    this.scene.time.delayedCall(700, () => { if (fire.active) fire.destroy(); });

    // Smoke — grows as it disperses, drifts upward
    const smoke = this.track(this.scene.add.particles(x, y, "pfx_smoke", {
      speed: { min: 12, max: 55 },
      angle: { min: 200, max: 340 },
      scale: { start: big ? 0.9 : 0.55, end: big ? 3.0 : 1.8 },
      alpha: { start: 0.58, end: 0 },
      lifespan: { min: 700, max: 1150 },
      gravityY: -28,
      blendMode: "NORMAL",
      emitting: false,
    }));
    smoke.explode(big ? 10 : 5);
    this.scene.time.delayedCall(1400, () => { if (smoke.active) smoke.destroy(); });

    // Sparks — fast outward, additive for the hot ember glow
    const sparks = this.track(this.scene.add.particles(x, y, "pfx_spark", {
      speed: { min: 90, max: big ? 260 : 190 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 180, max: 360 },
      blendMode: "ADD",
      emitting: false,
    }));
    sparks.explode(big ? 28 : 17);
    this.scene.time.delayedCall(500, () => { if (sparks.active) sparks.destroy(); });
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

  /** Generate soft radial-gradient textures for the particle system.
   * Runs once per Phaser texture cache (keyed, so safe to call from both
   * BattleScene and PlaygroundScene without duplicating the canvas data). */
  private ensureParticleTextures(): void {
    const t = this.scene.textures;

    if (!t.exists("pfx_fire")) {
      const c = t.createCanvas("pfx_fire", 32, 32)!;
      const ctx = c.context;
      ctx.clearRect(0, 0, 32, 32);
      const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0,    "rgba(255,220,80,1)");
      g.addColorStop(0.35, "rgba(255,80,0,.9)");
      g.addColorStop(1,    "rgba(200,20,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(16, 16, 16, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }

    if (!t.exists("pfx_smoke")) {
      const c = t.createCanvas("pfx_smoke", 48, 48)!;
      const ctx = c.context;
      ctx.clearRect(0, 0, 48, 48);
      const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0,   "rgba(70,50,30,.7)");
      g.addColorStop(0.5, "rgba(35,25,15,.4)");
      g.addColorStop(1,   "rgba(10,8,5,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(24, 24, 24, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }

    if (!t.exists("pfx_spark")) {
      const c = t.createCanvas("pfx_spark", 12, 12)!;
      const ctx = c.context;
      ctx.clearRect(0, 0, 12, 12);
      const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
      g.addColorStop(0,   "rgba(255,255,200,1)");
      g.addColorStop(0.5, "rgba(255,180,50,.8)");
      g.addColorStop(1,   "rgba(255,100,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(6, 6, 6, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }
  }
}
