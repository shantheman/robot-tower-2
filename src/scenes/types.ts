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
}

export interface EnemyBullet {
  dot: Phaser.GameObjects.Arc;
  vx: number; vy: number; damage: number;
  alive: boolean;
}
