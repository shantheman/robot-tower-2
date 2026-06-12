/** End-to-end harness — plays the real game in headless Chromium via the
 * DEV-only QA handles (window.rt2 = Game, window.rt2scene = BattleScene).
 *
 * The hard-won driving rules (re-learned in preview consoles before this
 * file existed — don't re-learn them again):
 *   - Step the sim with `sc.sys.step(t += 50, 50)`: it runs tweens + clock.
 *     NEVER call sc.update() directly (FX pile up as garbage).
 *   - dt is clamped per frame (MAX_DT), so stepping one huge delta does
 *     NOT fast-forward — always loop small steps.
 *   - `sc.freezeActive = 99999` holds enemies still (spawning continues):
 *     the way to accumulate a field without crashes ending the wave.
 *   - gs.hp = 999999 makes the tower unkillable for flow tests.
 *   - Positions are WORLD coords (960x720 landscape), not screen pixels.
 */

import { test, expect, Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function boot(page: Page): Promise<void> {
  await page.goto("/?reset"); // pristine save; the inline head script wipes it
  await page.waitForFunction(() => (window as any).rt2 && (window as any).rt2scene);
}

test("clearing a wave opens the shop and pays cores", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const rt2 = (window as any).rt2;
    const sc = (window as any).rt2scene;
    const gs = rt2.gs;
    rt2.show("battle");
    rt2.battle.startBattle();
    gs.hp = 999999;
    const cores0 = gs.cores;
    let t = performance.now();
    // Run until the wave is fully spawned, killing as we go; the clear
    // linger then ticks before the screen swap.
    for (let i = 0; i < 4000 && rt2.screen === "battle"; i++) {
      t += 50;
      sc.sys.step(t, 50);
      if (sc.toSpawn === 0) for (const e of [...sc.enemies]) sc.kill(e);
    }
    return {
      screen: rt2.screen, shopMode: rt2.shopMode,
      coresGained: gs.cores - cores0, wave: gs.wave,
    };
  });
  expect(r.screen).toBe("shop");
  expect(r.shopMode).toBe("cleared");
  expect(r.coresGained).toBeGreaterThan(0); // wave 1, level 1 -> +1 core
});

test("shop buys apply and the next wave starts", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const rt2 = (window as any).rt2;
    const sc = (window as any).rt2scene;
    const gs = rt2.gs;
    rt2.show("battle");
    rt2.battle.startBattle();
    gs.hp = 999999;
    let t = performance.now();
    for (let i = 0; i < 4000 && rt2.screen === "battle"; i++) {
      t += 50;
      sc.sys.step(t, 50);
      if (sc.toSpawn === 0) for (const e of [...sc.enemies]) sc.kill(e);
    }
    // In the between-waves shop: buy the Main Turret card via the real DOM.
    gs.money = 5000;
    rt2.show("shop"); // re-render with the new money
    const before = gs.turretLevel;
    (document.querySelector('.store-card[data-key="turret"]') as HTMLElement).click();
    const after = gs.turretLevel;
    // START NEXT WAVE via the real footer CTA
    (document.querySelector('#shop [data-act="next"]') as HTMLElement).click();
    return { before, after, screen: rt2.screen, wave: gs.wave };
  });
  expect(r.after).toBe(r.before + 1);
  expect(r.screen).toBe("battle");
  expect(r.wave).toBe(2);
});

test("skill unlock spends cores and survives a reload", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const rt2 = (window as any).rt2;
    const gs = rt2.gs;
    gs.cores = 500;
    rt2.show("skills");
    const cores0 = gs.cores;
    (document.querySelector(".skill-node.canbuy") as HTMLElement)?.click();
    return { spent: cores0 - gs.cores, owned: gs.skills.size };
  });
  expect(r.spent).toBeGreaterThan(0);
  expect(r.owned).toBe(1);
  // The unlock persisted (saves write-through on unlock).
  await page.reload();
  await page.waitForFunction(() => (window as any).rt2);
  const owned = await page.evaluate(() => (window as any).rt2.gs.skills.size);
  expect(owned).toBe(1);
});

test("tower death shows the dead screen; retry restarts the level", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const rt2 = (window as any).rt2;
    const sc = (window as any).rt2scene;
    const gs = rt2.gs;
    rt2.show("battle");
    rt2.battle.startBattle();
    gs.hp = 1;
    let t = performance.now();
    for (let i = 0; i < 4000 && rt2.screen === "battle"; i++) {
      t += 50;
      sc.sys.step(t, 50);
    }
    return { screen: rt2.screen };
  });
  expect(r.screen).toBe("dead");
  await page.click('#dead [data-act="retry"]');
  const after = await page.evaluate(() => {
    const rt2 = (window as any).rt2;
    return { screen: rt2.screen, hp: rt2.gs.hp, wave: rt2.gs.wave };
  });
  expect(after.screen).toBe("battle");
  expect(after.hp).toBeGreaterThan(1); // fresh tower
});
