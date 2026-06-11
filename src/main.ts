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
import { HomeScreen } from "./ui/home";
import { DeadScreen } from "./ui/dead";
import { PauseScreen } from "./ui/pause";
import { SettingsModal } from "./ui/settings";

const stage = document.getElementById("stage")!;
const panels = document.createElement("div");
panels.id = "panels";
stage.appendChild(panels);

const shop = new ShopPanel(panels);
const skills = new SkillsPanel(panels);
const home = new HomeScreen(panels);
new DeadScreen(panels);
const pause = new PauseScreen(panels);
const settings = new SettingsModal(document.body);
home.onSkills = () => { skills.returnTo = "home"; game.show("skills"); };
home.onSettings = () => settings.show();
pause.onSettings = () => settings.show();

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

// Boot to Home (the entry point), with the battle scene idling underneath.
game.screen = "home";
queueMicrotask(() => { game.screen = "battle"; game.show("home"); });

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
  if (settings.visible) {
    if (ev.key === "Escape") settings.hide();
    return;
  }
  if (game.screen === "battle") {
    if (ev.key === "Tab") openPauseShop();
    else if (ev.key === "t" || ev.key === "T") openSkills();
    else if (ev.key === "Escape") { game.battle?.setPaused(true); game.show("pause"); }
  } else if (game.screen === "pause") {
    if (ev.key === "Escape") pause.resume();
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

// A live battle auto-pauses when the window loses focus (parity with the
// original); regaining focus does NOT auto-resume.
window.addEventListener("blur", () => {
  if (game.screen === "battle") {
    game.battle?.setPaused(true);
    game.show("pause");
  }
});
