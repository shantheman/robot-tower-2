/** "YOU DIED" — layout per docs/design/screens.jsx, with the stale salvage
 * conversion replaced by the real v0.7.0 model: the card celebrates the Cores
 * already earned this run (they were granted at each wave clear). */

import { game } from "../game";
import { waveInLevel } from "../sim/waves";
import { Panel } from "./panel";

export class DeadScreen extends Panel {
  constructor(parent: HTMLElement) {
    super(parent, "dead", "dead", "panel-screen dead");
  }

  render(): void {
    const gs = game.gs;
    const cpWave = gs.checkpointWaveInLevel();
    this.setHtml(`
      <div class="dead-wrap">
        <div class="dead-title">YOU DIED</div>
        <div class="dead-sub">You fell on <b>Level ${gs.level}</b> · Wave ${waveInLevel(gs.wave)}</div>
        <div class="dead-btns">
          ${cpWave !== null && cpWave > 1
        ? `<button class="cta" data-act="checkpoint">RETRY FROM WAVE ${cpWave}</button>
           <button class="ghost-btn" data-act="retry">RESTART LEVEL ${gs.level}</button>`
        : `<button class="cta" data-act="retry">RETRY LEVEL ${gs.level}</button>`}
          <button class="ghost-btn" data-act="home">HOME</button>
        </div>
      </div>`);

    this.root.querySelector("[data-act=checkpoint]")?.addEventListener("click", () => {
      game.show("battle");
      game.battle?.retryFromCheckpoint();
    });
    this.root.querySelector("[data-act=retry]")?.addEventListener("click", () => {
      game.show("battle");
      game.battle?.startBattle();   // retries the SAME level from wave 1
    });
    this.root.querySelector("[data-act=home]")?.addEventListener("click", () => game.show("home"));
  }
}
