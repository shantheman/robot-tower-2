/** Home-screen tower-upgrade modal: the same TOWER LEVEL → LEVEL UP banner the
 * Upgrades shop shows, so you can spend Cores on your tower without starting a
 * run. Opened by clicking the "TOWER Lv X" box on Home. */

import { game } from "../game";
import { play } from "../audio";
import { towerBannerHtml } from "./towerBanner";

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
    this.root.innerHTML = `
      <div class="modal-card tower-modal-card">
        <header><span class="modal-title">UPGRADE TOWER</span><button class="modal-x" data-act="close">✕</button></header>
        ${towerBannerHtml()}
      </div>`;
    this.root.querySelector("[data-act=close]")?.addEventListener("click", () => this.hide());
    this.root.querySelector<HTMLButtonElement>("[data-act=towerup]")?.addEventListener("click", () => {
      if (game.gs.tryBuyTowerUpgrade()) { play("upgrade"); this.render(); }
    });
  }
}
