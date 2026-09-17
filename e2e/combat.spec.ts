import { expect, test, type Page } from '@playwright/test';
import { newGame, warpToField } from './helpers';

async function startInField(page: Page): Promise<string[]> {
  const errors = await newGame(page);
  await warpToField(page);
  return errors;
}

test.describe('combat', () => {
  test('modern scheme: shooting a spawned zombie damages and kills it, granting XP and drops', async ({ page }) => {
    const errors = await startInField(page);
    await page.evaluate(() => {
      window.__ec!.state.setSettings({ controlScheme: 'modern' });
      window.__ec!.god(true);
    });
    const xp0 = await page.evaluate(() => window.__ec!.hud().xp);
    const ammo0 = await page.evaluate(() => window.__ec!.hud().ammo);

    const uid = await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 110, 0));
    expect(uid).not.toBeNull();
    await page.waitForTimeout(100);

    // aim at the zombie's screen position and hold the trigger
    const target = await page.evaluate((id) => {
      const e = window.__ec!.enemies().find((x) => x.uid === id)!;
      return window.__ec!.toScreen(e.x, e.y)!;
    }, uid);
    await page.mouse.move(target.x, target.y);
    await page.mouse.down();
    await page.waitForFunction(
      (id) => {
        const e = window.__ec!.enemies().find((x) => x.uid === id);
        return !e; // killed → no longer alive
      },
      uid,
      { timeout: 20000 },
    );
    await page.mouse.up();

    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.xp).toBeGreaterThan(xp0);
    expect(hud.ammo).toBeLessThan(ammo0);
    await page.screenshot({ path: 'e2e/out/combat.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('zombies chase and hurt the player; death respawns in the safe zone', async ({ page }) => {
    const errors = await startInField(page);
    const hp0 = await page.evaluate(() => window.__ec!.hud().hp);
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) window.__ec!.spawn('zombie_stripe', 60 + i * 20, (i - 1.5) * 30);
    });
    await page.waitForFunction((h) => window.__ec!.hud().hp < h, hp0, { timeout: 15000 });
    // let them finish the job (starting HP ~104, 4 fast zombies)
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone', null, { timeout: 60000 });
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.mapId).toBe('gwangjin-gucheong-parking');
    expect(hud.hp).toBeGreaterThan(0);
    // respawn at 50% (+ a tick or two of safe-zone regen)
    expect(hud.hp).toBeLessThanOrEqual(hud.hpMax / 2 + 3);
    expect(hud.won).toBeLessThan(50_000); // death costs 5% of the ₩50,000 start
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
