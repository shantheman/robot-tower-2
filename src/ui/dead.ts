/** "YOU DIED" — layout per docs/design/screens.jsx, with the stale salvage
 * conversion replaced by the real v0.7.0 model: the card celebrates the Cores
 * already earned this run (they were granted at each wave clear). */

import { game } from "../game";
import { waveInLevel } from "../sim/waves";

export class DeadScreen {
  private root: HTMLElement;
  private timer: number | null = null;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "dead";
    this.root.className = "panel-screen dead hidden";
    parent.appendChild(this.root);
    game.register("dead", {
      onShow: () => { this.render(); this.root.classList.remove("hidden"); },
      onHide: () => {
        this.root.classList.add("hidden");
        if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
      },
    });
  }

  render(): void {
    const gs = game.gs;
    const earned = gs.runCores;
    const before = gs.cores - earned;
    this.root.innerHTML = `
      <div class="dead-wrap">
        <div class="dead-title">YOU DIED</div>
        <div class="dead-sub">You fell on <b>Level ${gs.level}</b> · Wave ${waveInLevel(gs.wave)}</div>
        <div class="dead-card">
          <div class="dc-label">CORES EARNED THIS RUN · BANKED AS WAVES WERE CLEARED</div>
          <div class="dc-row">
            <div class="dc-cell"><div class="dc-cap">EARNED</div>
              <div class="dc-val"><span class="core-icon"></span><b class="gr" id="dc-earned">+0</b></div></div>
            <div class="dc-arrow">⟶</div>
            <div class="dc-cell"><div class="dc-cap">TOTAL CORES</div>
              <div class="dc-val"><span class="core-icon"></span><b class="cy" id="dc-total">${before}</b></div></div>
          </div>
        </div>
        <div class="dead-keeps">
          <span>↺ resets: <b class="warm">Coins · Upgrades</b></span>
          <span>✓ kept: <b class="cool">Cores · Tower Level · Skills</b></span>
        </div>
        <div class="dead-btns">
          <button class="cta" data-act="retry">RETRY LEVEL ${gs.level} ▸</button>
          <button class="ghost-btn" data-act="home">HOME</button>
        </div>
      </div>`;

    // Count-up animation (the cores were already granted mid-run).
    const eEl = this.root.querySelector("#dc-earned")!;
    const tEl = this.root.querySelector("#dc-total")!;
    const t0 = performance.now();
    this.timer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - t0) / 1200);
      const now = Math.round(earned * t);
      eEl.textContent = `+${now}`;
      tEl.textContent = String(before + now);
      if (t >= 1 && this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    }, 40);

    this.root.querySelector("[data-act=retry]")?.addEventListener("click", () => {
      game.show("battle");
      game.battle?.startBattle();   // retries the SAME level from wave 1
    });
    this.root.querySelector("[data-act=home]")?.addEventListener("click", () => game.show("home"));
  }
}
