/** Battle entity records shared between BattleScene and its helpers
 * (drone.ts, effects.ts). Pure data + Phaser handles — no behavior. */

import Phaser from "phaser";
import * as C from "../config";

export interface Enemy {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  shadowOffX: number;    // fixed light direction: shadows fall down-right
  shadowOffY: number;    // land: a small rim past the feet; air: hover height
  hpBar?: Phaser.GameObjects.Graphics;
  type: C.EnemyType;
  hp: number; maxHp: number; speed: number;
  fireTimer: number;     // ranged enemies + boss covering fire
  fireCd: number;        // boss: level-scaled cooldown between shots
  fireDamage: number;    // boss: level-scaled per-shot tower damage
  flash: number;
  alive: boolean;
  // Procedural animation (config ENEMY_ANIM): random phase so units don't
  // pulse in sync; baseScale is the spawn scale the breathe pulse multiplies;
  // animOX/animOY are last frame's hover offset, undone before each move so
  // the bob never compounds into the movement integrator.
  animPhase: number;
  baseScale: number;
  animOX: number;
  animOY: number;
  rotors?: Phaser.GameObjects.Image[];
  rotorAngle: number;
  squadronWings?: Phaser.GameObjects.Image[];
  squadronShadows?: Phaser.GameObjects.Image[];
  squadronPhases: number[];
  snapSide: number;   // hex-snap: current face index (0..hexSnap-1)
  snapTimer: number;  // hex-snap: seconds until next idle side-change
  // Swiveling overlay (e.g. grunt radar dish): rotates to satTarget, pauses
  // satTimer seconds on arrival, then picks a new random heading.
  satellite?: Phaser.GameObjects.Image;
  satShadow?: Phaser.GameObjects.Image;  // dish silhouette cast onto the body
  satAngle: number;   // current swivel offset (rad), relative to the base facing
  satTarget: number;  // heading it's swivelling toward (rad)
  satTimer: number;   // seconds left to dwell once arrived
}

export interface EnemyBullet {
  dot: Phaser.GameObjects.Arc;
  vx: number; vy: number; damage: number;
  alive: boolean;
}
