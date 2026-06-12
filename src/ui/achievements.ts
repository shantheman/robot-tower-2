/** Achievements modal — opened from the Home top bar's trophy button.
 * Two-column grid on wide screens, single-column scroll on phones.
 * Unlocked rows show the check + the cores bounty already collected. */

import { game } from "../game";
import { ACHIEVEMENTS } from "../sim/state";
import { esc } from "./html";

export class AchievementsModal {
  private root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "achievements";
    this.root.className = "modal-dim hidden";
    parent.appendChild(this.root);
    this.root.addEventListener("click", (ev) => {
      if (ev.target === this.root) this.hide();
    });
  }

  show(): void { this.render(); this.root.classList.remove("hidden"); }
  hide(): void { this.root.classList.add("hidden"); }
  get visible(): boolean { return !this.root.classList.contains("hidden"); }

  render(): void {
    const gs = game.gs;
    const got = (id: string) => gs.achievements.has(id);
    const rows = ACHIEVEMENTS.map((a) => `
      <div class="ach-row ${got(a.id) ? "got" : ""}">
        <span class="ach-mark">${got(a.id) ? "✓" : `<img class="lock-ico" src="art/lock.webp" alt="locked" />`}</span>
        <span class="ach-col">
          <b class="ach-name">${esc(a.name)}</b>
          <span class="ach-how">${esc(a.how)}</span>
        </span>
        <span class="ach-bounty ${got(a.id) ? "paid" : ""}">
          <span class="core-icon small"></span>${a.bounty}
        </span>
      </div>`).join("");

    this.root.innerHTML = `
      <div class="modal-card ach-card">
        <header>
          <span class="modal-title">ACHIEVEMENTS&ensp;${gs.achievements.size}/${ACHIEVEMENTS.length}</span>
          <button class="modal-x" data-act="close">✕</button>
        </header>
        <div class="ach-grid">${rows}</div>
      </div>`;
    this.root.querySelector("[data-act=close]")?.addEventListener("click", () => this.hide());
  }
}
