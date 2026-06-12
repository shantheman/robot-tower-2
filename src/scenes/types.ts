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
  fireTimer: number;     // ranged enemies
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
}

export interface EnemyBullet {
  dot: Phaser.GameObjects.Arc;
  vx: number; vy: number; damage: number;
  alive: boolean;
}
