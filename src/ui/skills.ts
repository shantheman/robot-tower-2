/** The Skill Tree — real HTML/CSS per docs/design/panels.jsx. Color means
 * STATE, never category: green = owned, cyan = available, dim = locked.
 * Nodes and prices come from GameState (the original app's tree). */

import { game, isTouch } from "../game";
import { play } from "../audio";
import { SKILL_NODES, SkillNode } from "../sim/state";
import { catIcon } from "./icons";

const BRANCHES = ["CANNON", "DEFENSE", "DRONE", "ULTIMATES"] as const;

export class SkillsPanel {
  private root: HTMLElement;
  /** Where to return on close (home or battle). */
  returnTo: "home" | "battle" = "home";

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "skills";
    this.root.className = "panel-screen hidden";
    parent.appendChild(this.root);
    game.register("skills", {
      onShow: () => { this.render(); this.root.classList.remove("hidden"); },
      onHide: () => this.root.classList.add("hidden"),
    });
  }

  private nodeState(n: SkillNode): "owned" | "available" | "locked" {
    const gs = game.gs;
    if (gs.skills.has(n.key)) return "owned";
    if (n.prereq && !gs.skills.has(n.prereq)) return "locked";
    return "available";
  }

  private nodeHtml(n: SkillNode): string {
    const state = this.nodeState(n);
    const gs = game.gs;
    const prereqName = n.prereq ? SKILL_NODES.find((p) => p.key === n.prereq)?.name : "";
    const footer = state === "owned"
      ? `<div class="sn-owned">✓ OWNED</div>`
      : state === "available"
        ? `<div class="sn-price ${gs.cores >= n.cost ? "" : "cant"}"><span class="core-icon small"></span> ${n.cost}</div>`
        : `<div class="sn-locked">🔒 <span>needs <b>${prereqName}</b></span></div>`;
    return `<button class="skill-node ${state}" data-key="${n.key}">
      <span class="sn-name">${n.name}</span>
      <span class="sn-desc">${n.desc}</span>
      ${footer}
    </button>`;
  }

  render(): void {
    const gs = game.gs;
    const cols = BRANCHES.map((branch) => {
      const nodes = SKILL_NODES.filter((n) => n.branch === branch);
      const items = nodes.map((n, i) => {
        const conn = i > 0
          ? `<span class="sn-conn ${this.nodeState(nodes[i - 1]) === "owned" ? "lit" : ""}"></span>`
          : "";
        return conn + this.nodeHtml(n);
      }).join("");
      return `<div class="skill-col"><div class="sc-head">${catIcon(branch)}<span>${branch}</span></div>${items}</div>`;
    }).join("");

    this.root.innerHTML = `
      <header class="panel-head">
        <button class="back-btn" data-act="back">‹ Back</button>
        <div class="panel-title-group"><h1>SKILL TREE</h1></div>
        <div class="panel-money"><span class="core-icon"></span><b class="cores-b">${gs.cores}</b>
          <span class="cores-lbl">CORES</span></div>
      </header>
      <div class="tree-sub">Unlock a node to let that power appear in your in-round Upgrades panel.</div>
      <div class="tree-legend">
        <span class="lg owned"><i></i>OWNED</span>
        <span class="lg avail"><i></i>AVAILABLE</span>
        <span class="lg locked"><i></i>LOCKED</span>
      </div>
      <div class="tree-cols">${cols}</div>
      <div class="tree-foot">${isTouch() ? "Tap" : "Click"} a node to unlock it.</div>`;

    this.root.querySelectorAll<HTMLButtonElement>(".skill-node.available").forEach((el) => {
      el.addEventListener("click", () => {
        if (game.gs.tryUnlockSkill(el.dataset.key as SkillNode["key"])) { play("buy"); this.render(); }
      });
    });
    this.root.querySelector("[data-act=back]")?.addEventListener("click", () => this.close());
  }

  close(): void {
    game.show(this.returnTo);
    if (this.returnTo === "battle") game.battle?.resumeWave();
  }
}
