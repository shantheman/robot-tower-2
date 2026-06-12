/** THE keyboard map — every shortcut in the game routes through here.
 * (Code health #9: previously split between main.ts and a Phaser handler.)
 *
 *   Modal open:  Esc closes Settings / Achievements (and nothing else fires)
 *   BATTLE:      Tab -> pause-shop · T -> skill tree · Esc -> pause
 *                Space -> fire equipped ultimate
 *   PAUSE:       Esc -> resume
 *   SKILLS:      Esc / T -> close (back to home or battle)
 *   SHOP paused: Tab / Esc -> resume battle
 *   SHOP cleared: Space / Enter -> start next wave
 *
 * Touch devices never see these (no keyboard); the kbd hints in the UI are
 * hidden via the html.touch class. */

import { game } from "./game";

export interface KeyboardDeps {
  shop: { close(): void; startNext(): void };
  skills: { close(): void };
  pause: { resume(): void };
  settings: { visible: boolean; hide(): void };
  achievements: { visible: boolean; hide(): void };
  openSkills: () => void;
  openPauseShop: () => void;
}

export function installKeyboardRouting(d: KeyboardDeps): void {
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Tab") ev.preventDefault(); // never let Tab move focus
    if (d.settings.visible) {
      if (ev.key === "Escape") d.settings.hide();
      return;
    }
    if (d.achievements.visible) {
      if (ev.key === "Escape") d.achievements.hide();
      return;
    }
    if (game.screen === "battle") {
      if (ev.key === "Tab") d.openPauseShop();
      else if (ev.key === "t" || ev.key === "T") d.openSkills();
      else if (ev.key === "Escape") { game.battle?.setPaused(true); game.show("pause"); }
      else if (ev.key === " ") { ev.preventDefault(); game.battle?.fireUltimate(); }
    } else if (game.screen === "pause") {
      if (ev.key === "Escape") d.pause.resume();
    } else if (game.screen === "skills") {
      if (ev.key === "Escape" || ev.key === "t" || ev.key === "T") d.skills.close();
    } else if (game.screen === "shop") {
      if (game.shopMode === "paused" && (ev.key === "Tab" || ev.key === "Escape")) d.shop.close();
      else if (game.shopMode === "cleared" && (ev.key === " " || ev.key === "Enter")) {
        ev.preventDefault();
        d.shop.startNext();
      }
    }
  });
}
