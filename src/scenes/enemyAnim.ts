/** One frame of an enemy's procedural "alive" animation, factored out so the
 * battle scene AND the dev Animation Playground apply it identically (tune in
 * the playground, paste the values into config ENEMY_ANIM, the game matches).
 *
 * Returns the hover offset to add to the sprite's LOGICAL position; the caller
 * adds it and must undo it before the next movement step so the bob never
 * compounds into the movement integrator. */

import Phaser from "phaser";
import * as C from "../config";

export interface EnemyAnimFrameOpts {
  sprite: Phaser.GameObjects.Image;
  shadow?: Phaser.GameObjects.Image;
  anim: C.EnemyAnim | undefined;
  clock: number;        // seconds (advances with enemyDt: freeze pauses, warp slows)
  phase: number;        // per-enemy random offset so they don't pulse in sync
  baseScale: number;    // the breathe pulse multiplies this
  fireCharge: number;   // 0..1 ranged charge-tell; 0 for everything else
  towerX: number;
  towerY: number;
}

export function enemyAnimFrame(o: EnemyAnimFrameOpts): { ox: number; oy: number } {
  const a = o.anim;
  const t = o.clock;
  const ph = o.phase;
  // Always face the tower, plus a small rotational wobble.
  let rot = Math.atan2(o.towerY - o.sprite.y, o.towerX - o.sprite.x) + Math.PI / 2;
  if (a?.wobbleDeg) rot += Phaser.Math.DegToRad(a.wobbleDeg) * Math.sin(t * (a.wobbleHz ?? 3) + ph);
  o.sprite.setRotation(rot);
  o.shadow?.setRotation(rot);
  // Idle breathe + ranged charge-tell swell.
  let scaleMul = 1;
  if (a?.breatheAmp) scaleMul += a.breatheAmp * Math.sin(t * (a.breatheHz ?? 2) + ph);
  if (a?.chargeTell) scaleMul += o.fireCharge * o.fireCharge * 0.18;
  o.sprite.setScale(o.baseScale * scaleMul);
  // Hover bob (air units): float up/down with a little sway; the grounded
  // shadow fades as the unit rises, to sell altitude.
  if (a?.bobAmp) {
    const hz = a.bobHz ?? 2.5;
    const up = Math.sin(t * hz + ph);
    const ox = Math.cos(t * hz * 0.6 + ph) * a.bobAmp * 0.35;
    const oy = -up * a.bobAmp;
    o.sprite.x += ox;
    o.sprite.y += oy;
    o.shadow?.setAlpha(C.SHADOW.airAlpha * (1 - ((up + 1) / 2) * 0.35));
    return { ox, oy };
  }
  return { ox: 0, oy: 0 };
}
