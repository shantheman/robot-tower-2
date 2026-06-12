/** Silhouette shadows — the unit's own sprite, black-tinted, cast down-right
 * by the fixed top-left light (knobs in config SHADOW). Used by enemies and
 * the drone; the tower's two shadows stay bespoke in BattleScene (they pin
 * to sprite origins and the gun's falls ONTO the base). */

import Phaser from "phaser";
import * as C from "../config";

export function shadowOffset(radius: number, air: boolean): { x: number; y: number } {
  return air ? C.SHADOW.airOff(radius) : C.SHADOW.landOff(radius);
}

export function makeSilhouette(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Layer,
  texture: string,
  x: number,
  y: number,
  ownerScale: number,
  air: boolean,
): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, texture)
    .setScale(ownerScale * (air ? C.SHADOW.airScale : 1))
    .setTintFill(0x000000)
    .setAlpha(air ? C.SHADOW.airAlpha : C.SHADOW.landAlpha);
  layer.add(img);
  return img;
}
