/** The "TOWER LEVEL → LEVEL UP" banner, shared by the Upgrades shop and the
 * Home-screen tower modal so they stay identical. Pure HTML; the caller wires
 * the [data-act=towerup] button (gs.tryBuyTowerUpgrade()). */

import { game } from "../game";

export function towerBannerHtml(): string {
  const gs = game.gs;
  const cost = gs.towerUpgradeCost();
  const pips = Array.from({ length: 10 }, (_, i) =>
    `<span class="pip ${i < Math.min(10, gs.towerLevel) ? "lit" : ""}"></span>`).join("");
  return `<section class="tower-hero">
        <div class="turret-thumb">
          <img class="tt-base" src="sprites/turret_base.png" alt="" />
          <img class="tt-gun" src="sprites/turret_gun_1.png" alt="" />
        </div>
        <div class="tower-info">
          <div class="tower-line">
            <span class="tl-head">
              <span class="tower-label">TOWER LEVEL</span>
              <span class="perm-badge">✦ PERMANENT</span>
            </span>
            <span class="tl-nums">
              <span class="tl-now">${gs.towerLevel}</span>
              <span class="tl-arrow">→</span>
              <span class="tl-next">${gs.towerLevel + 1}</span>
            </span>
          </div>
          <div class="pips">${pips}</div>
          <div class="tower-perks"><span>+10% earnings</span><span>+20 max HP</span><span>+30 start coins</span></div>
        </div>
        <button class="cta levelup ${gs.cores >= cost ? "" : "disabled"}" data-act="towerup" data-sfx="none">
          <span class="cta-big">LEVEL UP</span>
          <span class="cta-sub"><span class="core-icon small"></span> ${cost.toLocaleString("en-US")} cores</span>
        </button>
      </section>`;
}
