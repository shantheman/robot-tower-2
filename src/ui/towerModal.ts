/** Home-screen tower-upgrade modal: spend Cores to raise your permanent tower
 * level. Detailed current → next breakdown (per the 2026-06-13 mock), using
 * coins (never "$") + the core icon. Opened by clicking the "TOWER Lv X" box. */

import { game } from "../game";
import * as C from "../config";
import { play } from "../audio";

export class TowerModal {
  private root: HTMLElement;
  /** Assigned by main.ts — refresh the Home strip after closing. */
  onClose: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "tower-modal";
    this.root.className = "modal-dim hidden";
    parent.appendChild(this.root);
    this.root.addEventListener("click", (ev) => {
      if (ev.target === this.root) this.hide();
    });
  }

  show(): void { this.render(); this.root.classList.remove("hidden"); }
  hide(): void {
    this.root.classList.add("hidden");
    game.gs.save();
    this.onClose();
  }

  private render(): void {
    const gs = game.gs;
    const lv = gs.towerLevel, next = lv + 1, max = 10;
    const cost = gs.towerUpgradeCost();
    const afford = gs.cores >= cost;
    const pips = Array.from({ length: max }, (_, i) =>
      `<span class="pip ${i < Math.min(max, lv) ? "lit" : ""}${i === lv ? " next" : ""}"></span>`).join("");
    const left = max - lv;
    const remain = left > 0 ? `${left} level${left === 1 ? "" : "s"} remaining` : "Fully geared";

    const coin = `<span class="coin-icon"></span>`;
    const earnNow = (1 + C.TOWER_EARN_PER_LEVEL * lv).toFixed(2);
    const earnNext = (1 + C.TOWER_EARN_PER_LEVEL * next).toFixed(2);
    const hpNow = C.TOWER_MAX_HP + C.TOWER_HP_PER_LEVEL * lv;
    const hpNext = hpNow + C.TOWER_HP_PER_LEVEL;
    const cashNow = C.TOWER_CASH_PER_LEVEL * lv;
    const cashNext = C.TOWER_CASH_PER_LEVEL * next;
    const row = (label: string, from: string, to: string, delta: string) =>
      `<div class="tu-row"><span class="tu-label">${label}</span>
        <span class="tu-vals"><span class="tu-from">${from}</span><span class="tu-arr">→</span><span class="tu-to">${to}</span></span>
        <span class="tu-delta">${delta}</span></div>`;

    const c = cost.toLocaleString("en-US");
    const btn = afford
      ? `<button class="cta levelup" data-act="towerup" data-sfx="none">
           <span class="cta-big">LEVEL UP</span><span class="core-icon small"></span> ${c}</button>`
      : `<button class="cta levelup disabled" data-act="towerup" data-sfx="none" disabled>
           <img class="lock-ico" src="art/lock.webp" alt="" /><span class="cta-big">LEVEL UP</span><span class="core-icon small"></span> ${c}
           <span class="cta-need">You need ${(cost - gs.cores).toLocaleString("en-US")} more cores</span></button>`;

    this.root.innerHTML = `
      <div class="modal-card tower-modal-card">
        <header>
          <span class="tu-head-left"><span class="modal-title">TOWER UPGRADE</span><span class="perm-badge">✦ PERMANENT</span></span>
          <button class="modal-x" data-act="close">✕</button>
        </header>
        <div class="tu-top">
          <div class="turret-thumb tu-thumb">
            <img class="tt-base" src="sprites/turret_base.png" alt="" />
            <img class="tt-gun" src="sprites/turret_gun_1.png" alt="" />
          </div>
          <div class="tu-level">
            <div class="tu-lvline"><span class="tu-lvlbl">LEVEL</span><span class="tl-now">${lv}</span><span class="tl-arrow">→</span><span class="tl-next">${next}</span></div>
            <div class="pips">${pips}</div>
            <div class="tu-remaining">${remain}</div>
          </div>
        </div>
        <div class="tu-gives">WHAT LEVEL ${next} GIVES YOU</div>
        <div class="tu-rows">
          ${row("Coins Earned", `×${earnNow}`, `×${earnNext}`, `+${Math.round(C.TOWER_EARN_PER_LEVEL * 100)}%`)}
          ${row("Max Tower HP", hpNow.toLocaleString("en-US"), hpNext.toLocaleString("en-US"), `+${C.TOWER_HP_PER_LEVEL}`)}
          ${row("Starting Coins", `${coin}${cashNow}`, `${coin}${cashNext}`, `+${C.TOWER_CASH_PER_LEVEL}`)}
        </div>
        <footer class="tu-foot">
          <div class="tu-cores"><label>YOUR CORES</label>
            <span class="tu-cores-val"><span class="core-icon small"></span><b>${gs.cores.toLocaleString("en-US")}</b></span></div>
          ${btn}
        </footer>
      </div>`;

    this.root.querySelector("[data-act=close]")?.addEventListener("click", () => this.hide());
    this.root.querySelector<HTMLButtonElement>("[data-act=towerup]")?.addEventListener("click", () => {
      if (game.gs.tryBuyTowerUpgrade()) { play("upgrade"); this.render(); }
    });
  }
}
