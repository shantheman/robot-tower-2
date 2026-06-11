/** The Skill Tree — per the 2026-06-11 mocks. Color means STATE, everywhere:
 *   green = owned · bright cyan = can buy NOW · muted = can't afford yet ·
 *   dim + padlock = locked (prereq).
 * Desktop: slim header + 4 columns. Mobile: tabbed branches with per-branch
 * unlock counts. Exit is the bottom CTA (no top Back). */

import { game, isTouch } from "../game";
import { play } from "../audio";
import { SKILL_NODES, SkillNode } from "../sim/state";
import { Category, ITEM_ART, catIcon } from "./icons";

const BRANCHES = ["CANNON", "DEFENSE", "DRONE", "ULTIMATES"] as const;
type NodeState = "owned" | "canbuy" | "cant" | "locked";

export class SkillsPanel {
  private root: HTMLElement;
  /** Where to return on close (home or battle). */
  returnTo: "home" | "battle" = "home";
  private activeBranch: Category = "CANNON";

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

  private nodeState(n: SkillNode): NodeState {
    const gs = game.gs;
    if (gs.skills.has(n.key)) return "owned";
    if (n.prereq && !gs.skills.has(n.prereq)) return "locked";
    return gs.cores >= n.cost ? "canbuy" : "cant";
  }

  private nodeHtml(n: SkillNode): string {
    const state = this.nodeState(n);
    const prereqName = n.prereq ? SKILL_NODES.find((p) => p.key === n.prereq)?.name : "";
    const footer = state === "owned"
      ? `<div class="sn-owned">✓ OWNED</div>`
      : state === "locked"
        ? `<div class="sn-locked">🔒 <span>needs <b>${prereqName}</b></span></div>`
        : `<div class="sn-price ${state === "cant" ? "cant" : ""}"><span class="core-icon small"></span> ${n.cost}</div>`;
    const art = ITEM_ART[n.key];
    return `<button class="skill-node ${state}" data-key="${n.key}">
      <span class="sn-head">
        ${art ? `<span class="sn-tile"><img src="${art}" alt="" draggable="false" /></span>` : ""}
        <span class="sn-col">
          <span class="sn-name">${n.name}</span>
          <span class="sn-desc">${n.desc}</span>
        </span>
      </span>
      ${footer}
    </button>`;
  }

  render(): void {
    const gs = game.gs;
    const cols = BRANCHES.map((branch) => {
      const nodes = SKILL_NODES.filter((n) => n.branch === branch);
      const owned = nodes.filter((n) => gs.skills.has(n.key)).length;
      const items = nodes.map((n, i) => {
        const conn = i > 0
          ? `<span class="sn-conn ${this.nodeState(nodes[i - 1]) === "owned" ? "lit" : ""}"></span>`
          : "";
        return conn + this.nodeHtml(n);
      }).join("");
      return `<div class="skill-col ${branch === this.activeBranch ? "active" : ""}" data-branch="${branch}">
        <div class="sc-head">${catIcon(branch)}<span>${branch}</span>
          <span class="sc-count">${owned}/${nodes.length} unlocked</span></div>
        ${items}
      </div>`;
    }).join("");

    const tabs = BRANCHES.map((b) =>
      `<button class="tree-tab ${b === this.activeBranch ? "active" : ""}" data-branch="${b}">
        ${catIcon(b)}<span>${b}</span>
      </button>`).join("");

    this.root.innerHTML = `
      <header class="panel-head">
        <div class="panel-title-group"><h1>SKILL TREE</h1></div>
      </header>
      <div class="tree-legend">
        <span class="lg owned"><i></i>OWNED</span>
        <span class="lg avail"><i></i>CAN BUY</span>
        <span class="lg locked"><i></i>LOCKED</span>
        <span class="lg-hint">|&ensp;unlocks appear in your in-battle Upgrades</span>
      </div>
      <div class="tree-tabs">${tabs}</div>
      <div class="tree-cols">${cols}</div>
      <div class="tree-foot">${isTouch() ? "Tap" : "Click"} a node to unlock it.</div>
      <footer class="panel-foot">
        <div class="foot-bal"><label>CORES</label>
          <span class="fb-val"><span class="core-icon"></span><b class="cy">${gs.cores}</b></span></div>
        <button class="cta startwave" data-act="back">
          <span class="play">▸&#xFE0E;</span>
          <span class="cta-col"><span class="cta-big">${this.returnTo === "battle" ? "RESUME BATTLE" : "BACK TO BASE"}</span>
          ${isTouch() ? "" : `<span class="cta-sub2">[Esc]</span>`}</span>
        </button>
      </footer>`;

    this.root.querySelectorAll<HTMLButtonElement>(".skill-node.canbuy").forEach((el) => {
      el.addEventListener("click", () => {
        if (game.gs.tryUnlockSkill(el.dataset.key as SkillNode["key"])) { play("buy"); this.render(); }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>(".tree-tab").forEach((el) => {
      el.addEventListener("click", () => {
        this.activeBranch = el.dataset.branch as Category;
        this.render();
      });
    });
    this.root.querySelector("[data-act=back]")?.addEventListener("click", () => this.close());
  }

  close(): void {
    game.show(this.returnTo);
    if (this.returnTo === "battle") game.battle?.resumeWave();
  }
}
