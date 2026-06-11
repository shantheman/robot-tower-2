/** Economy/progression parity tests — mirror the original smoke_test.py. */

import { describe, expect, it } from "vitest";
import { GameState, SKILL_NODES } from "../src/sim/state";
import * as C from "../src/config";

function fakeStorage(): Pick<Storage, "getItem" | "setItem"> & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

function fresh(rand: () => number = () => 0.99): GameState {
  return new GameState(fakeStorage(), rand);
}

describe("economy core (parity with smoke_test.py)", () => {
  it("costs grow geometrically from the right bases", () => {
    const g = fresh();
    expect(g.genCost()).toBe(50);
    expect(g.turretCost()).toBe(60);
    expect(g.towerUpgradeCost()).toBe(50);          // v0.7.0 rebase
    g.towerLevel = 1;
    expect(g.towerUpgradeCost()).toBe(70);          // 50 * 1.4
    g.money = 10_000;
    g.tryBuyGen();
    expect(g.genCost()).toBe(80);                   // 50 * 1.6
  });

  it("skill-gated buys refuse without the tree node", () => {
    const g = fresh();
    g.money = 10_000;
    expect(g.tryBuyMulti()).toBe(false);
    g.skills.add("multi");
    expect(g.tryBuyMulti()).toBe(true);
    expect(g.multiLevel).toBe(1);
  });

  it("repair only when hurt; plating raises current AND max HP", () => {
    const g = fresh();
    g.money = 10_000;
    g.skills.add("repair").add("plating");
    expect(g.tryBuyRepair()).toBe(false);           // full HP -> no buy
    g.hp = 40;
    expect(g.tryBuyRepair()).toBe(true);
    expect(g.hp).toBe(70);
    const max0 = g.maxHp();
    expect(g.tryBuyPlating()).toBe(true);
    expect(g.maxHp()).toBe(max0 + C.PLATING_HP);
  });

  it("shield layers soak 30 each; overflow hits the tower (tank example)", () => {
    const g = fresh();
    g.money = 10_000;
    g.skills.add("repair").add("plating").add("shield");
    g.tryBuyShield();
    expect(g.shield).toBe(2);
    g.shield = 1;
    const r = g.damageTower(34);                    // the SPEC's literal example
    expect(r.layersSpent).toBe(1);
    expect(r.hpLost).toBe(4);
    g.shield = 3; g.hp = g.maxHp();
    const r2 = g.damageTower(90);                   // boss slam: exactly 3 layers
    expect(r2.layersSpent).toBe(3);
    expect(r2.hpLost).toBe(0);
  });

  it("cores: +1 x level per cleared wave, +15 x level on the boss wave; never from coins", () => {
    const g = fresh();
    g.level = 2;
    g.resetRun();
    g.money = 9_999;                                // hoarded coins must be worthless
    const c0 = g.cores;
    g.wave = 8;                                     // level 2, wave 1 (not boss)
    expect(g.onWaveCleared()).toEqual({ bossWave: false, coresEarned: 2 });
    g.wave = 17;                                    // level 2 boss wave
    const r = g.onWaveCleared();
    expect(r).toEqual({ bossWave: true, coresEarned: 2 + 30 });
    expect(g.cores).toBe(c0 + 34);
    expect(g.level).toBe(3);                        // boss clear advances the level
  });

  it("ultimates: own many, equip one, buying auto-equips", () => {
    const g = fresh();
    g.money = 10_000;
    g.skills.add("emp").add("freeze");
    expect(g.tryBuyUltimate("emp")).toBe(true);
    expect(g.tryBuyUltimate("freeze")).toBe(true);
    expect(g.equippedUltimate).toBe("freeze");
    expect(g.tryBuyUltimate("freeze")).toBe(false); // already owned
    expect(g.equipUltimate("emp")).toBe(true);
  });

  it("kill bonuses: 8% chance; heal never rolls at full HP", () => {
    let calls = 0;
    const seq = [0.01, 0.05];                       // roll passes, lands in "cash" band
    const g = fresh(() => seq[Math.min(calls++, seq.length - 1)]);
    const m0 = g.money;
    const { bonus } = g.onKill(5, false);
    expect(bonus).toBe("cash");                     // full HP -> heal weight 0
    expect(g.money).toBeGreaterThan(m0 + 5);        // reward + 40-coin bonus
  });

  it("combo multiplies kill rewards and decays after the window", () => {
    const g = fresh();
    g.onKill(10, false);
    g.onKill(10, false);
    expect(g.comboMult()).toBeCloseTo(1.1);
    g.tick(C.COMBO_WINDOW + 0.1);
    expect(g.combo).toBe(0);
  });

  it("skill tree: prereqs gate, cores are spent, tree total is 1430", () => {
    const g = fresh();
    g.cores = 10_000;
    expect(g.tryUnlockSkill("pierce")).toBe(false); // needs multi
    expect(g.tryUnlockSkill("multi")).toBe(true);
    expect(g.tryUnlockSkill("pierce")).toBe(true);
    expect(SKILL_NODES.reduce((a, n) => a + n.cost, 0)).toBe(1430);
  });

  it("save/load round-trips permanent state only", () => {
    const store = fakeStorage();
    const g = new GameState(store, () => 0.99);
    g.cores = 123; g.towerLevel = 2; g.level = 4;
    g.skills.add("multi");
    g.volume = 0.4; g.reduceMotion = true;
    g.money = 555; // run state: must NOT persist
    g.save();
    const g2 = new GameState(store, () => 0.99);
    expect(g2.cores).toBe(123);
    expect(g2.towerLevel).toBe(2);
    expect(g2.level).toBe(4);
    expect(g2.skills.has("multi")).toBe(true);
    expect(g2.volume).toBeCloseTo(0.4);
    expect(g2.reduceMotion).toBe(true);
    expect(g2.money).toBe(g2.startCash());          // fresh run economy
  });

  it("achievements unlock on their triggers", () => {
    const g = fresh();
    g.money = 2_500;
    g.checkAchievements();
    expect(g.achievements.has("rich")).toBe(true);
    g.wave = 26;
    g.checkAchievements();
    expect(g.achievements.has("wave10") && g.achievements.has("wave25")).toBe(true);
  });
});
