/** One frame of an enemy's procedural "alive" animation, factored out so the
 * battle scene AND the dev Animation Playground apply it identically (tune in
 * the playground, paste the values into config ENEMY_ANIM, the game matches).
 *
 * Returns the hover offset to add to the sprite's LOGICAL position; the caller
 * adds it and must undo it before the next movement step so the bob never
 * compounds into the movement integrator. */

import Phaser from "phaser";
import * as C from "../config";

/** Place + rotate the 4 rotor blades for an enemy that has rotors config.
 * Call AFTER enemyAnimFrame so sprite.x/y/scaleX are already at their
 * animated values (rotors visually follow bob and breathe). */
/** Place all wing planes for a squadron enemy each frame. Wings drift
 * independently in local space (sinusoidal per-plane phase offsets) while
 * following the leader's position (which already has the group bob). */
export function updateSquadron(
  sprite: Phaser.GameObjects.Image,
  wings: Phaser.GameObjects.Image[],
  offsets: [number, number][],
  driftAmp: number,
  driftHz: number,
  clock: number,
  phases: number[],
): void {
  const rot = sprite.rotation;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  for (let i = 0; i < wings.length; i++) {
    const [lx, ly] = offsets[i];
    const ph = phases[i];
    const dx = driftAmp * Math.sin(clock * driftHz + ph);
    const dy = driftAmp * 0.5 * Math.cos(clock * driftHz * 0.7 + ph + 1.3);
    const wx = lx + dx, wy = ly + dy;
    wings[i].setPosition(
      sprite.x + wx * cos - wy * sin,
      sprite.y + wx * sin + wy * cos,
    );
    wings[i].setScale(sprite.scale);
    wings[i].setRotation(rot);
  }
}

/** Plant a swiveling overlay (e.g. a radar dish) on a body sprite. The overlay
 * shares an aligned canvas with the base, so its `pivot` (origin, set once at
 * spawn) is the same point on both. We place that pivot on the base's rotated
 * mount point and rotate the overlay by the base facing plus its own swivel —
 * so at swivel 0 it overlays exactly as the artist drew it. */
export function placeSatellite(
  base: Phaser.GameObjects.Image,
  sat: Phaser.GameObjects.Image,
  pivot: [number, number],
  swivel: number,
  shadow?: Phaser.GameObjects.Image,
  drop = 0,
): void {
  const lx = (pivot[0] - 0.5) * base.displayWidth;
  const ly = (pivot[1] - 0.5) * base.displayHeight;
  const r = base.rotation, cos = Math.cos(r), sin = Math.sin(r);
  const x = base.x + lx * cos - ly * sin;
  const y = base.y + lx * sin + ly * cos;
  // Shadow first (it sits below the dish): same silhouette + swivel, dropped
  // down-right by a fixed screen offset (light from top-left).
  shadow?.setPosition(x + drop * 0.6, y + drop).setScale(base.scaleX).setRotation(r + swivel);
  sat.setPosition(x, y);
  sat.setScale(base.scaleX);
  sat.setRotation(r + swivel);
}

export function updateEnemyRotors(
  sprite: Phaser.GameObjects.Image,
  rotors: Phaser.GameObjects.Image[],
  armReach: number,
  angle: number,
): void {
  const rot = sprite.rotation;
  // Arm tip offset in each local axis; use current scaleX so rotors follow breathe.
  const armOff = sprite.scaleX * sprite.width * 0.5 * armReach;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  // 4 arm tips in sprite-local space (SE, SW, NW, NE); rotated to world.
  const lx = [+armOff, -armOff, -armOff, +armOff];
  const ly = [+armOff, +armOff, -armOff, -armOff];
  for (let i = 0; i < 4; i++) {
    rotors[i].setPosition(
      sprite.x + lx[i] * cos - ly[i] * sin,
      sprite.y + lx[i] * sin + ly[i] * cos,
    );
    rotors[i].setScale(sprite.scaleX);
    // Even indices CW, odd CCW (opposite diagonal pairs)
    rotors[i].setRotation(i % 2 === 0 ? angle : -angle);
  }
}

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
  // Hex-snap enemies: rotation is set by the caller (lerped to a discrete face).
  // Everyone else: face the tower, plus a small rotational wobble.
  if (a?.hexSnap) {
    o.shadow?.setRotation(o.sprite.rotation);
  } else {
    let rot = Math.atan2(o.towerY - o.sprite.y, o.towerX - o.sprite.x) + Math.PI / 2;
    if (a?.wobbleDeg) rot += Phaser.Math.DegToRad(a.wobbleDeg) * Math.sin(t * (a.wobbleHz ?? 3) + ph);
    o.sprite.setRotation(rot);
    o.shadow?.setRotation(rot);
  }
  // Ranged charge-tell swell.
  let scaleMul = 1;
  if (a?.chargeTell) scaleMul += o.fireCharge * o.fireCharge * 0.18;
  o.sprite.setScale(o.baseScale * scaleMul);
  // Static altitude: lift the sprite above its logical ground position.
  // The shadow stays at the logical position and dims proportionally.
  const alt = a?.altitude ?? 0;
  if (alt) o.sprite.y -= alt;

  // Hover bob (air units): float up/down with a little sway; the grounded
  // shadow fades as the unit rises, to sell altitude.
  if (a?.bobAmp) {
    const hz = a.bobHz ?? 2.5;
    const up = Math.sin(t * hz + ph);
    const ox = Math.cos(t * hz * 0.6 + ph) * a.bobAmp * 0.35;
    const oy = -up * a.bobAmp;
    o.sprite.x += ox;
    o.sprite.y += oy;
    const altFade = Math.min(1, alt / 40);
    const baseAlpha = C.SHADOW.airAlpha * (1 - altFade * 0.3);
    o.shadow?.setAlpha(baseAlpha * (1 - ((up + 1) / 2) * 0.35));
    // Return total offset (bob + altitude) so the caller can undo both next frame.
    return { ox, oy: oy - alt };
  }
  if (alt !== 0 && o.shadow) {
    // Negative altitude grounds the unit (shadow tighter); positive lifts it (shadow dims).
    const altFade = Math.min(1, Math.max(0, alt) / 40);
    o.shadow.setAlpha(C.SHADOW.landAlpha * (1 - altFade * 0.4));
  }
  return { ox: 0, oy: -alt };
}
