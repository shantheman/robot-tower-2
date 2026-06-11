/** Parity tests: these assertions mirror the original repo's smoke_test.py so
 * the port provably matches the Python game's math. If a value changes here,
 * it must change in docs/SPEC-game-mechanics.md too. */

import { describe, expect, it } from "vitest";
import {
  effectiveWave, enemyPopulation, isBossWave, levelForWave, levelStartWave,
  waveInLevel, waveRobotCount, waveSpawnInterval, wavesForLevel,
} from "../src/sim/waves";
import { GRUNT, FAST, TOUGH, WAVE_CLEAR_CORES, LEVEL_CLEAR_CORES } from "../src/config";

describe("wave/level math (parity with smoke_test.py)", () => {
  it("levels have 7/10/15 waves, then cap at 15 (v2 balance)", () => {
    expect([1, 2, 3, 4, 5, 10].map(wavesForLevel)).toEqual([7, 10, 15, 15, 15, 15]);
  });

  it("level start waves chain correctly", () => {
    expect(levelStartWave(1)).toBe(1);
    expect(levelStartWave(2)).toBe(8);   // after 7 waves
    expect(levelStartWave(3)).toBe(18);  // after 7+10
    expect(levelForWave(7)).toBe(1);
    expect(levelForWave(8)).toBe(2);
    expect(waveInLevel(8)).toBe(1);
  });

  it("the last wave of each level is the boss wave", () => {
    expect(isBossWave(7)).toBe(true);    // level 1 ends at wave 7
    expect(isBossWave(6)).toBe(false);
    expect(isBossWave(17)).toBe(true);   // level 2 ends at wave 17
    expect(isBossWave(32)).toBe(true);   // level 3: 18..32 (capped at 15 waves)
  });

  it("effective wave resets each level and ramps steeper on later levels", () => {
    expect(effectiveWave(1)).toBeCloseTo(1.6);          // DIFF_WAVE1
    expect(effectiveWave(8)).toBeCloseTo(1.6);          // resets at level 2
    const l1Step = effectiveWave(2) - effectiveWave(1); // 0.7
    const l2Step = effectiveWave(9) - effectiveWave(8); // 0.7 * 1.35
    expect(l2Step).toBeGreaterThan(l1Step);
  });

  it("early waves spawn only grunts + fast; tough unlocks at ew >= 2.5", () => {
    const [popW1] = enemyPopulation(1);
    expect(popW1).toEqual([GRUNT, FAST]);
    const [popW3] = enemyPopulation(3); // ew = 1.6 + 2*0.7 = 3.0
    expect(popW3).toContain(TOUGH);
  });

  it("wave 1 has 5 robots + ~1 per effective wave after", () => {
    expect(waveRobotCount(1)).toBe(6); // 5 + round(1 * (1.6-1)) = 6
    expect(waveRobotCount(2)).toBe(6); // 5 + round(1.3) — same as Python's round
    expect(waveRobotCount(3)).toBe(7); // 5 + round(2.0)
  });

  it("spawn interval tightens but never below the floor", () => {
    expect(waveSpawnInterval(1)).toBeCloseTo(1.1 - 0.02 * 0.6);
    expect(waveSpawnInterval(999)).toBeCloseTo(0.45);
  });

  it("cores model: wave pays 1 x level, boss wave adds 15 x level", () => {
    // (constants pinned so a balance change is a conscious SPEC update)
    expect(WAVE_CLEAR_CORES).toBe(1);
    expect(LEVEL_CLEAR_CORES).toBe(15);
  });
});
