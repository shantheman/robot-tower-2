/** Pause overlay (Esc in battle): Resume / Settings / Quit to Home.
 * Quitting keeps the Cores already earned (they're granted per cleared wave —
 * an instant quit earns nothing, by design). */

import { game } from "../game";

export class PauseScreen {
  private root: HTMLElement;
  onSettings: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "pause";
    this.root.className = "modal-dim hidden";
    parent.appendChild(this.root);
    game.register("pause", {
      onShow: () => { this.render(); this.root.classList.remove("hidden"); },
      onHide: () => this.root.classList.add("hidden"),
    });
  }

  render(): void {
    this.root.innerHTML = `
      <div class="modal-card pause-card">
        <header><span class="modal-title">PAUSED</span></header>
        <button class="cta wide" data-act="resume">RESUME&ensp;<kbd>Esc</kbd></button>
        <button class="ghost-btn wide" data-act="settings">SETTINGS</button>
        <button class="ghost-btn wide warn" data-act="quit">QUIT TO HOME</button>
      </div>`;
    this.root.querySelector("[data-act=resume]")?.addEventListener("click", () => this.resume());
    this.root.querySelector("[data-act=settings]")?.addEventListener("click", () => this.onSettings());
    this.root.querySelector("[data-act=quit]")?.addEventListener("click", () => {
      const gs = game.gs;
      gs.bestWave = Math.max(gs.bestWave, gs.wave);
      gs.save();
      game.show("home");
    });
  }

  resume(): void {
    game.show("battle");
    game.battle?.resumeWave();
  }
}
