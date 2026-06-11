/** DOM HUD updater — the battle scene calls this every frame with its state.
 * All chrome is real HTML/CSS (see index.html + styles.css); this file only
 * moves numbers and toggles classes. */

import type { HudState } from "../scenes/BattleScene";
import { isBossWave, levelStartWave } from "../sim/waves";

const $ = (id: string) => document.getElementById(id)!;

let lastShown = { level: -1, wave: -1, money: -1, cores: -1, hp: -1, count: -1 };

export function updateHud(s: HudState): void {
  if (s.level !== lastShown.level) {
    $("hud-level").textContent = String(s.level);
    lastShown.level = s.level;
  }
  const waveText = s.waveInLevel * 1000 + s.wavesInLevel;
  if (waveText !== lastShown.wave) {
    $("hud-wave").textContent = `${s.waveInLevel}/${s.wavesInLevel}`;
    lastShown.wave = waveText;
  }
  if (s.money !== lastShown.money) {
    $("hud-money").textContent = String(Math.floor(s.money));
    lastShown.money = s.money;
  }
  if (s.cores !== lastShown.cores) {
    $("hud-cores").textContent = String(s.cores);
    lastShown.cores = s.cores;
  }
  if (s.hp !== lastShown.hp) {
    const fill = $("hud-hp");
    fill.style.width = `${(100 * s.hp) / s.maxHp}%`;
    fill.classList.toggle("low", s.hp / s.maxHp <= 0.35);
    $("hud-hp-text").textContent = `${Math.max(0, Math.ceil(s.hp))} / ${s.maxHp}`;
    lastShown.hp = s.hp;
  }

  // Wave-intro countdown overlay
  const intro = $("wave-intro");
  if (s.intermission > 0) {
    intro.classList.remove("hidden");
    $("wi-level").textContent = `LEVEL ${s.level}`;
    const globalWave = levelStartWave(s.level) + s.waveInLevel - 1;
    const boss = isBossWave(globalWave);
    const waveEl = $("wi-wave");
    waveEl.textContent = boss ? "BOSS WAVE" : `WAVE ${s.waveInLevel}`;
    waveEl.classList.toggle("boss", boss);
    const count = Math.max(1, Math.ceil(s.intermission));
    if (count !== lastShown.count) {
      $("wi-count").textContent = String(count);
      lastShown.count = count;
    }
  } else {
    intro.classList.add("hidden");
  }
}
