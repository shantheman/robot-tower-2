/** Entry point: boot Phaser into #game with the DOM HUD + panels overlaid.
 * The Game controller (src/game.ts) owns flow; this file wires the pieces
 * and the global keyboard routing. */

import Phaser from "phaser";
import { WORLD_H, WORLD_W } from "./config";
import { game } from "./game";
import { BattleScene } from "./scenes/BattleScene";
import { updateHud } from "./ui/hud";
import { ShopPanel } from "./ui/shop";
import { SkillsPanel } from "./ui/skills";

const stage = document.getElementById("stage")!;
const panels = document.createElement("div");
panels.id = "panels";
stage.appendChild(panels);

const shop = new ShopPanel(panels);
const skills = new SkillsPanel(panels);

const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WORLD_W,
  height: WORLD_H,
  backgroundColor: "#081120",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [],
});
phaser.scene.add("battle", BattleScene, true, { onHud: updateHud });

// For now the game boots straight into battle; the Home screen takes over as
// the entry point in the flow phase.
game.screen = "battle";

// Dev/debug handle (used by the headless QA driver; harmless in production).
(window as unknown as Record<string, unknown>).rt2 = game;

// HUD buttons
document.getElementById("btn-shop")?.addEventListener("click", openPauseShop);
document.getElementById("btn-skills")?.addEventListener("click", openSkills);

function openSkills(): void {
  if (game.screen === "battle") {
    skills.returnTo = "battle";
    game.battle?.setPaused(true);
  } else if (game.screen === "home") {
    skills.returnTo = "home";
  } else return;
  game.show("skills");
}

function openPauseShop(): void {
  if (game.screen !== "battle") return;
  game.shopMode = "paused";
  game.battle?.setPaused(true);
  game.show("shop");
}

// Global keyboard routing (Phaser handles Space-fires-ultimate in battle).
window.addEventListener("keydown", (ev) => {
  if (ev.key === "Tab") ev.preventDefault(); // never let Tab move focus
  if (game.screen === "battle") {
    if (ev.key === "Tab") openPauseShop();
    else if (ev.key === "t" || ev.key === "T") openSkills();
  } else if (game.screen === "skills") {
    if (ev.key === "Escape" || ev.key === "t" || ev.key === "T") skills.close();
  } else if (game.screen === "shop") {
    if (game.shopMode === "paused" && (ev.key === "Tab" || ev.key === "Escape")) shop.close();
    else if (game.shopMode === "cleared" && (ev.key === " " || ev.key === "Enter")) {
      ev.preventDefault();
      shop.startNext();
    }
  }
});
