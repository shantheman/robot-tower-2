/** Settings modal — sound toggle, volume slider, reduce-motion, fullscreen.
 * Same options as the original game's panel (plus the version + credits
 * footer). Opens over Home or as the in-battle pause menu's settings. */

import { game } from "../game";
import { SAVE_KEY } from "../sim/state";
import { decodeSave, encodeSave } from "../sim/savecode";
import { GAME_VERSION } from "../version";

export class SettingsModal {
  private root: HTMLElement;
  /** Assigned by main.ts — e.g. resume the battle when the modal closes. */
  onClose: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "settings";
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
  get visible(): boolean { return !this.root.classList.contains("hidden"); }

  private row(label: string, control: string): string {
    return `<div class="set-row"><span class="set-label">${label}</span>${control}</div>`;
  }

  render(): void {
    const gs = game.gs;
    const toggle = (key: string, on: boolean) =>
      `<button class="set-toggle ${on ? "on" : ""}" data-key="${key}">${on ? "ON" : "OFF"}</button>`;
    this.root.innerHTML = `
      <div class="modal-card">
        <header><span class="modal-title">SETTINGS</span><button class="modal-x" data-act="close">✕</button></header>
        ${this.row("Volume", `<span class="set-slider"><input type="range" min="0" max="100" value="${Math.round(gs.volume * 100)}" data-key="volume" />
          <b id="vol-pct">${Math.round(gs.volume * 100)}%</b></span>`)}
        ${this.row("Reduce motion (no shake)", toggle("motion", gs.reduceMotion))}
        ${this.row("Transfer save", `<span class="set-pair">
          <button class="set-toggle" data-key="export">EXPORT</button>
          <button class="set-toggle" data-key="import">IMPORT</button></span>`)}
        <div class="set-row save-io hidden" data-io="export">
          <input readonly data-field="export" aria-label="Save code" />
        </div>
        <div class="set-row save-io hidden" data-io="import">
          <input data-field="import" placeholder="Paste a CD1. save code…" aria-label="Save code to load" />
          <button class="set-toggle danger" data-key="apply">LOAD</button>
        </div>
        ${this.row("Reset progress", `<button class="set-toggle danger" data-key="reset">RESET</button>`)}
        ${this.row("Animation playground", `<a class="set-toggle" href="playground.html" target="_blank" rel="noopener" style="text-decoration:none;text-align:center">OPEN ↗</a>`)}
        <footer class="modal-foot">
          <span>v${GAME_VERSION} © 2026 Callum Bauman / Bauman Games.</span>
        </footer>
      </div>`;

    this.root.querySelectorAll<HTMLButtonElement>(".set-toggle").forEach((el) => {
      el.addEventListener("click", () => {
        const k = el.dataset.key;
        if (k === "motion") gs.reduceMotion = !gs.reduceMotion;
        else if (k === "reset") {
          if (el.textContent === "SURE?") {
            localStorage.removeItem(SAVE_KEY);
            location.reload();
          } else {
            el.textContent = "SURE?"; // second tap confirms
          }
          return;
        } else if (k === "export") {
          // Persist the latest state, then surface the code (clipboard +
          // a visible field for manual copy on stingy mobile browsers).
          gs.save();
          const code = encodeSave(localStorage.getItem(SAVE_KEY) ?? "{}");
          const row = this.root.querySelector<HTMLElement>('[data-io="export"]')!;
          const field = row.querySelector<HTMLInputElement>("input")!;
          row.classList.remove("hidden");
          field.value = code;
          field.select();
          navigator.clipboard?.writeText(code).then(
            () => { el.textContent = "COPIED"; },
            () => { /* field stays selectable */ });
          return;
        } else if (k === "import") {
          this.root.querySelector('[data-io="import"]')?.classList.remove("hidden");
          this.root.querySelector<HTMLInputElement>('[data-field="import"]')?.focus();
          return;
        } else if (k === "apply") {
          const field = this.root.querySelector<HTMLInputElement>('[data-field="import"]')!;
          const json = decodeSave(field.value);
          if (!json) { el.textContent = "INVALID"; return; }
          if (el.textContent === "SURE?") {
            localStorage.setItem(SAVE_KEY, json); // overwrites this browser's save
            location.reload();
          } else {
            el.textContent = "SURE?"; // it replaces current progress
          }
          return;
        }
        gs.save();
        this.render();
      });
    });
    const slider = this.root.querySelector<HTMLInputElement>("input[data-key=volume]");
    slider?.addEventListener("input", () => {
      gs.volume = Number(slider.value) / 100;
      this.root.querySelector("#vol-pct")!.textContent = `${slider.value}%`;
    });
    slider?.addEventListener("change", () => gs.save());
    this.root.querySelector("[data-act=close]")?.addEventListener("click", () => this.hide());
  }
}
