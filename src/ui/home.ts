/** Home screen — new/returning states per the mobile mocks (Downloads drop,
 * 2026-06-11): portrait stacks full-width controls under the hero; landscape
 * is hero-left / menu-right. Title stays "ROBOT TOWER" (the original app wins
 * on names unless the rename to "Core Defender" is made deliberately). */

import { game } from "../game";
import { SKILL_NODES } from "../sim/state";

export class HomeScreen {
  private root: HTMLElement;
  onSkills: () => void = () => {};
  onSettings: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "home";
    this.root.className = "panel-screen home hidden";
    parent.appendChild(this.root);
    game.register("home", {
      onShow: () => { this.render(); this.root.classList.remove("hidden"); },
      onHide: () => this.root.classList.add("hidden"),
    });
  }

  render(): void {
    const gs = game.gs;
    const returning = gs.towerLevel > 0 || gs.cores > 0 || gs.level > 1
      || gs.skills.size > 0 || gs.bestWave > 0;

    const strip = !returning ? "" : `
      <div class="home-strip">
        <div class="hs-box"><label>REACHED</label><b class="lt">Lv ${gs.level}</b></div>
        <div class="hs-box"><label>CORES</label><span class="hs-val"><span class="core-icon small"></span><b class="cy">${gs.cores}</b></span></div>
        <div class="hs-box"><label>TOWER</label><b class="cy">Lv ${gs.towerLevel}</b></div>
        <div class="hs-box"><label>SKILLS</label><b class="gr">${gs.skills.size}/${SKILL_NODES.length}</b></div>
      </div>`;

    this.root.innerHTML = `
      <div class="home-grid"></div>
      <div class="home-topbar">
        ${returning ? `<div class="home-cores"><span class="core-icon small"></span><b>${gs.cores}</b></div>` : ""}
        <button class="gear" data-act="settings" title="Settings">⚙</button>
      </div>
      <div class="home-cols">
        <div class="home-hero">
          <div class="hero-turret">
            <span class="hero-glow"></span>
            <img class="hero-base" src="sprites/turret_base.png" alt="" />
            <img class="hero-gun" src="sprites/turret_gun.png" alt="" />
          </div>
          <div class="home-badge">${returning ? "WELCOME BACK, DEFENDER" : "A 360° SURVIVAL DEFENSE"}</div>
          <h1 class="home-title">ROBOT TOWER</h1>
        </div>
        <div class="home-menu">
          ${strip}
          <button class="menu-btn primary" data-act="play">
            <span class="mb-icon">▸&#xFE0E;</span>
            <span class="mb-col"><span class="mb-title">${returning ? "CONTINUE" : "NEW GAME"}</span>
            <span class="mb-sub">${returning ? `Jump back in · Level ${gs.level} · Wave 1` : "Begin at Level 1 · Wave 1"}</span></span>
          </button>
          <div class="menu-row">
            <button class="menu-btn green" data-act="skills"><span class="mb-icon">⏣</span>
              <span class="mb-col"><span class="mb-title">SKILL TREE</span>
              <span class="mb-sub">${returning ? `${gs.cores} cores ready` : "Spend cores"}</span></span></button>
            <button class="menu-btn" data-act="settings"><span class="mb-icon">⚙</span>
              <span class="mb-col"><span class="mb-title">SETTINGS</span><span class="mb-sub">Sound & more</span></span></button>
          </div>
          ${returning
        ? `<button class="restart-link" data-act="restart">Restart from Level 1 (cores & skills kept)</button>`
        : `<div class="home-blurb">Defend the core from robots closing in on every side.
            Survive waves, earn coins to spend, and bank permanent Cores for every wave you clear.</div>`}
          <div class="home-credit">A game by Callum</div>
        </div>
      </div>`;

    this.root.querySelector("[data-act=play]")?.addEventListener("click", () => {
      game.show("battle");
      game.battle?.startBattle();
    });
    this.root.querySelectorAll("[data-act=skills]").forEach((el) =>
      el.addEventListener("click", () => this.onSkills()));
    this.root.querySelectorAll("[data-act=settings]").forEach((el) =>
      el.addEventListener("click", () => this.onSettings()));
    this.root.querySelector("[data-act=restart]")?.addEventListener("click", () => {
      game.gs.level = 1;       // checkpoint back to the start; meta is kept
      game.gs.save();
      this.render();
    });
  }
}
