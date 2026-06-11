/** The Upgrades store — real HTML/CSS per docs/design/panels.jsx. Content and
 * prices come from GameState (the original app's values); the mock supplies
 * only the look. Opens between waves ("cleared") or on Tab ("paused"). */

import * as C from "../config";
import { game } from "../game";
import { play } from "../audio";
import { waveInLevel, wavesForLevel } from "../sim/waves";

interface CardSpec {
  key: string;
  name: string;
  desc: string;
  cost: number | null;          // null -> owned (green check)
  state: "buy" | "poor" | "owned" | "equipped";
  onBuy?: () => boolean;
}

export class ShopPanel {
  private root: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "shop";
    this.root.className = "panel-screen hidden";
    parent.appendChild(this.root);
    game.register("shop", {
      onShow: () => { this.render(); this.root.classList.remove("hidden"); },
      onHide: () => this.root.classList.add("hidden"),
    });
  }

  private fieldCards(): CardSpec[] {
    const gs = game.gs;
    const m = gs.money;
    const cards: CardSpec[] = [
      {
        key: "gen", name: "Generator",
        desc: `Lv ${gs.genLevel} · +${Math.round(C.GEN_INCOME * (gs.genLevel + 1))} coins/sec`,
        cost: gs.genCost(), state: m >= gs.genCost() ? "buy" : "poor",
        onBuy: () => gs.tryBuyGen(),
      },
      {
        key: "auto", name: "Auto-Shooter",
        desc: gs.autoLevel === 0 ? "deploy · auto-targets" : `Lv ${gs.autoLevel} · fires faster`,
        cost: gs.autoCost(), state: m >= gs.autoCost() ? "buy" : "poor",
        onBuy: () => gs.tryBuyAuto(),
      },
      {
        key: "turret", name: "Main Turret",
        desc: `Lv ${gs.turretLevel} · +dmg, rate, size`,
        cost: gs.turretCost(), state: m >= gs.turretCost() ? "buy" : "poor",
        onBuy: () => gs.tryBuyTurret(),
      },
      {
        key: "drone", name: "Drone",
        desc: gs.droneLevel === 0 ? "deploy · auto-hunts" : `Lv ${gs.droneLevel} · +dmg, range, rate`,
        cost: gs.droneCost(), state: m >= gs.droneCost() ? "buy" : "poor",
        onBuy: () => gs.tryBuyDrone(),
      },
    ];
    if (gs.skills.has("multi")) cards.push({
      key: "multi", name: "Multi-Shot", desc: `Lv ${gs.multiLevel} · +1 bullet / lvl`,
      cost: gs.multiCost(), state: m >= gs.multiCost() ? "buy" : "poor",
      onBuy: () => gs.tryBuyMulti(),
    });
    if (gs.skills.has("pierce")) cards.push({
      key: "pierce", name: "Piercing", desc: `Lv ${gs.pierceLevel} · pass through`,
      cost: gs.pierceCost(), state: m >= gs.pierceCost() ? "buy" : "poor",
      onBuy: () => gs.tryBuyPierce(),
    });
    if (gs.skills.has("explosive")) cards.push({
      key: "explosive", name: "Explosive", desc: `Lv ${gs.explosiveLevel} · hits blast`,
      cost: gs.explosiveCost(), state: m >= gs.explosiveCost() ? "buy" : "poor",
      onBuy: () => gs.tryBuyExplosive(),
    });
    if (gs.skills.has("guided")) cards.push({
      key: "guided", name: "Guided", desc: "bullets bend to foes",
      cost: gs.guidedOwned ? null : C.GUIDED_COST,
      state: gs.guidedOwned ? "owned" : m >= C.GUIDED_COST ? "buy" : "poor",
      onBuy: () => gs.tryBuyGuided(),
    });
    if (gs.skills.has("repair")) {
      const hurt = gs.hp < gs.maxHp();
      cards.push({
        key: "repair", name: "Repair", desc: `restore +${C.REPAIR_HP} HP`,
        cost: gs.repairCost(),
        state: hurt && m >= gs.repairCost() ? "buy" : "poor",
        onBuy: () => gs.tryBuyRepair(),
      });
    }
    if (gs.skills.has("plating")) cards.push({
      key: "plating", name: "Plating", desc: `+${C.PLATING_HP} max HP`,
      cost: gs.platingCost(), state: m >= gs.platingCost() ? "buy" : "poor",
      onBuy: () => gs.tryBuyPlating(),
    });
    if (gs.skills.has("shield")) cards.push({
      key: "shield", name: "Shield",
      desc: gs.shieldLevel === 0
        ? `${C.SHIELD_BASE_HITS} layers, ${C.SHIELD_HIT_ABSORB} dmg each`
        : `Lv ${gs.shieldLevel} · +1 layer`,
      cost: gs.shieldCost(), state: m >= gs.shieldCost() ? "buy" : "poor",
      onBuy: () => gs.tryBuyShield(),
    });
    return cards;
  }

  private ultimateCards(): CardSpec[] {
    const gs = game.gs;
    return (["emp", "freeze", "warp", "laser"] as C.UltimateKey[])
      .filter((k) => gs.skills.has(k))
      .map((k) => {
        const owned = gs.ultimatesOwned.has(k);
        const equipped = gs.equippedUltimate === k;
        const cost = C.ULTIMATE_COSTS[k];
        return {
          key: k, name: C.ULTIMATE_NAMES[k],
          desc: { emp: "Zap + stun everything", freeze: "Freezes all enemies", warp: "Slow-motion for enemies", laser: "The mega-beam" }[k],
          cost: owned ? null : cost,
          state: equipped ? "equipped" as const : owned ? "owned" as const
            : gs.money >= cost ? "buy" as const : "poor" as const,
          onBuy: () => owned ? gs.equipUltimate(k) : gs.tryBuyUltimate(k),
        };
      });
  }

  private card(it: CardSpec): string {
    const priceOrState = it.cost === null || it.state === "equipped"
      ? `<div class="card-state">✓ ${it.state === "equipped" ? "EQUIPPED" : "OWNED"}</div>`
      : `<div class="card-price ${it.state === "poor" ? "poor" : ""}">
           <span class="coin-icon ${it.state === "poor" ? "dim" : ""}"></span>
           ${it.cost!.toLocaleString("en-US")}
         </div>`;
    return `<button class="store-card ${it.state}" data-key="${it.key}">
      <span class="card-name">${it.name}</span>
      <span class="card-desc">${it.desc}</span>
      ${priceOrState}
    </button>`;
  }

  render(): void {
    const gs = game.gs;
    const cleared = game.shopMode === "cleared";
    const wil = waveInLevel(gs.wave);
    const total = wavesForLevel(gs.level);
    const towerCost = gs.towerUpgradeCost();
    const pips = Array.from({ length: 10 }, (_, i) =>
      `<span class="pip ${i < Math.min(10, gs.towerLevel) ? "lit" : ""}"></span>`).join("");
    const ults = this.ultimateCards();

    this.root.innerHTML = `
      <header class="panel-head">
        ${cleared ? "" : `<button class="back-btn" data-act="close">‹ Back</button>`}
        <div class="panel-title-group">
          <h1>UPGRADES</h1>
          <span class="panel-status ${cleared ? "ok" : ""}">${cleared ? "✓ WAVE CLEARED" : "❚❚ BATTLE PAUSED"}</span>
        </div>
        <div class="panel-money"><span class="coin-icon"></span><b>${Math.floor(gs.money).toLocaleString("en-US")}</b></div>
      </header>

      <section class="tower-hero">
        <div class="turret-thumb">
          <img class="tt-base" src="sprites/turret_base.png" alt="" />
          <img class="tt-gun" src="sprites/turret_gun.png" alt="" />
        </div>
        <div class="tower-info">
          <div class="tower-line">
            <span class="tower-label">TOWER LEVEL</span>
            <span class="perm-badge">✦ PERMANENT</span>
            <span class="tl-now">${gs.towerLevel}</span>
            <span class="tl-arrow">→</span>
            <span class="tl-next">${gs.towerLevel + 1}</span>
          </div>
          <div class="pips">${pips}</div>
          <div class="tower-perks"><span>+10% earnings</span><span>+20 max HP</span><span>+30 start cash</span></div>
        </div>
        <button class="cta levelup ${gs.cores >= towerCost ? "" : "disabled"}" data-act="towerup">
          <span class="cta-big">LEVEL UP</span>
          <span class="cta-sub"><span class="core-icon small"></span> ${towerCost.toLocaleString("en-US")} cores</span>
        </button>
      </section>

      <div class="section-head field"><span class="sh-label">FIELD UPGRADES</span>
        <span class="sh-note">↺ reset at end of level</span><span class="sh-rule"></span></div>
      <div class="card-grid">${this.fieldCards().map((c) => this.card(c)).join("")}</div>

      ${ults.length === 0 ? "" : `
      <div class="section-head ult"><span class="sh-label">ULTIMATES</span>
        <span class="sh-note">own many · click to equip · [Space] fires it · reset at end of level</span><span class="sh-rule"></span></div>
      <div class="card-grid ult">${ults.map((c) => this.card(c)).join("")}</div>`}

      <footer class="panel-foot">
        ${cleared
        ? `<button class="cta startwave" data-act="next">
             <span class="play">▶</span>
             <span class="cta-col"><span class="cta-big">START NEXT WAVE</span>
             <span class="cta-sub2">Wave ${Math.min(wil + 1, total)} of ${total} · [Space]</span></span>
           </button>`
        : `<span class="foot-hint">[Tab / Esc] Close & resume</span>`}
      </footer>`;

    // Wire clicks
    const all = [...this.fieldCards(), ...this.ultimateCards()];
    this.root.querySelectorAll<HTMLButtonElement>(".store-card").forEach((el) => {
      el.addEventListener("click", () => {
        const spec = all.find((c) => c.key === el.dataset.key);
        if (spec?.onBuy?.()) { play("buy"); this.render(); }
      });
    });
    this.root.querySelector("[data-act=towerup]")?.addEventListener("click", () => {
      if (game.gs.tryBuyTowerUpgrade()) { play("buy"); this.render(); }
    });
    this.root.querySelector("[data-act=next]")?.addEventListener("click", () => this.startNext());
    this.root.querySelector("[data-act=close]")?.addEventListener("click", () => this.close());
  }

  startNext(): void {
    if (game.shopMode !== "cleared") return;
    game.show("battle");
    game.battle?.nextWave();
  }

  close(): void {
    if (game.shopMode !== "paused") return;
    game.show("battle");
    game.battle?.resumeWave();
  }
}
