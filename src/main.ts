/** Entry point: boot Phaser into #game with the DOM HUD overlaid.
 * Scale.FIT keeps the logical 960x720 world and letterboxes to any window —
 * phones/tablets/desktop, portrait or landscape. */

import Phaser from "phaser";
import { WORLD_H, WORLD_W } from "./config";
import { BattleScene } from "./scenes/BattleScene";
import { updateHud } from "./ui/hud";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WORLD_W,
  height: WORLD_H,
  backgroundColor: "#081120",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
});

game.scene.add("battle", BattleScene, true, { onHud: updateHud });
