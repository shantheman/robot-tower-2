/** Entry point: boot Phaser into #game with the DOM HUD + panels overlaid.
 * The Game controller (src/game.ts) owns flow; this file wires the pieces
 * and the global keyboard routing. */

import "./crash"; // FIRST: the crash banner must catch module-init errors below
import Phaser from "phaser";
import { WORLD_AR_MAX, WORLD_AR_MIN, WORLD_H, WORLD_PORTRAIT_W } from "./config";
import { game } from "./game";
import { installKeyboardRouting } from "./input";
import { BattleScene } from "./scenes/BattleScene";
import { updateHud } from "./ui/hud";
import { ShopPanel } from "./ui/shop";
import { SkillsPanel } from "./ui/skills";
import { HomeScreen } from "./ui/home";
import { DeadScreen } from "./ui/dead";
import { PauseScreen } from "./ui/pause";
import { SettingsModal } from "./ui/settings";
import { AchievementsModal } from "./ui/achievements";

if (matchMedia("(hover: none) and (pointer: coarse)").matches) {
  document.documentElement.classList.add("touch");
}

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
const achievements = new AchievementsModal(document.body);
home.onSkills = () => { skills.returnTo = "home"; game.show("skills"); };
home.onSettings = () => settings.show();
home.onAchievements = () => achievements.show();
pause.onSettings = () => settings.show();

// Size the world to the window's aspect ratio so the canvas fills the screen
// (no FIT pillarbox) — enemies then enter from the real edges. The reference
// axis is fixed (height in landscape, width in portrait) to keep the tower a
// constant on-screen size; the other axis stretches to the screen, clamped so
// extreme ratios don't make an absurd arena.
{
  const winW = Math.max(1, window.innerWidth);
  const winH = Math.max(1, window.innerHeight);
  const clamp = (v: number) => Math.min(WORLD_AR_MAX, Math.max(WORLD_AR_MIN, v));
  if (winH > winW) {
    const ar = clamp(winH / winW); // portrait: tall arena
    game.world = { w: WORLD_PORTRAIT_W, h: Math.round(WORLD_PORTRAIT_W * ar) };
  } else {
    const ar = clamp(winW / winH); // landscape: wide arena
    game.world = { w: Math.round(WORLD_H * ar), h: WORLD_H };
  }
}

const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: game.world.w,
  height: game.world.h,
  transparent: true, // the page draws the backdrop + grid (full-bleed at any ratio)
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [],
});
phaser.scene.add("battle", BattleScene, true, { onHud: updateHud });

// Boot to Home (the entry point), with the battle scene idling underneath.
game.screen = "home";
queueMicrotask(() => { game.screen = "battle"; game.show("home"); });

// Dev/debug handle (used by the headless QA driver) — dev builds only.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).rt2 = game;
}

// HUD buttons
document.getElementById("btn-shop")?.addEventListener("click", openPauseShop);
// The ultimate-ready chip doubles as the fire button (the only way on touch).
document.getElementById("st-ult")?.addEventListener("click", () => {
  if (game.screen === "battle") game.battle?.fireUltimate();
});
// Battle HUD gear: pause and open the same settings modal as the Home screen;
// closing it resumes the battle (other screens are left as they are).
document.getElementById("hud-gear")?.addEventListener("click", () => {
  if (game.screen !== "battle") return;
  game.battle?.setPaused(true);
  settings.show();
});
settings.onClose = () => {
  if (game.screen === "battle") game.battle?.resumeWave();
};
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

// Global keyboard routing — the full shortcut map lives in src/input.ts.
installKeyboardRouting({ shop, skills, pause, settings, achievements, openSkills, openPauseShop });

// A live battle auto-pauses when the window loses focus (parity with the
// original); regaining focus does NOT auto-resume.
window.addEventListener("blur", () => {
  if (game.screen === "battle") {
    game.battle?.setPaused(true);
    game.show("pause");
  }
});

// Orientation: the world size is picked at boot, so a rotation mid-session
// letterboxes until reload. Reload to re-pick the world — immediately when
// it's lossless (Home: no run in flight; permanent progress is saved),
// otherwise the next time the player lands on Home.
const bootPortrait = window.innerHeight > window.innerWidth;
let orientationStale = false;
function onViewportChange(): void {
  const portraitNow = window.innerHeight > window.innerWidth;
  if (portraitNow === bootPortrait) { orientationStale = false; return; }
  if (game.screen === "home") location.reload();
  else orientationStale = true;
}
window.addEventListener("resize", onViewportChange);
window.addEventListener("orientationchange", onViewportChange);
game.onScreenChange = (s) => {
  if (s === "home" && orientationStale) location.reload();
};
