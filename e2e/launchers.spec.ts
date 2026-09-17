import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

async function prep(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    window.__ec!.state.setSettings({ controlScheme: 'modern' });
    window.__ec!.god(true);
    const c = window.__ec!.state.character;
    window.__ec!.state.setCharacter({ ...c, won: 2_000_000, level: 25, base: { ...c.base, 지능: 30 } });
  });
}

test.describe('launchers (투척/중화기)', () => {
  test('M79 grenade arcs to the cursor and the blast hurts a whole cluster of zombies', async ({ page }) => {
    const errors = await newGame(page);
    await warpToField(page);
    await prep(page);

    expect(await page.evaluate(() => window.__ec!.actions.buy('m79').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.buy('ammo_grenade').ok)).toBe(true);
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'm79')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.equipToggle(u).ok, uid)).toBe(true);
    let hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('M79 유탄발사기');
    expect(hud.ammo).toBe(30);

    // three zombies standing together 170px to the right
    const ids = await page.evaluate(() => [window.__ec!.spawn('zombie_casual_f', 170, 0), window.__ec!.spawn('zombie_casual_f', 190, 24), window.__ec!.spawn('zombie_casual_f', 150, -22)]);
    await page.waitForTimeout(150);
    const p = await page.evaluate(() => window.__ec!.player()!);
    const aim = await page.evaluate((pp) => window.__ec!.toScreen(pp.x + 170, pp.y)!, p);
    await page.mouse.move(aim.x, aim.y);
    await page.mouse.down();
    // hold until the round leaves (headless frames can be >100ms apart); rpm 30 keeps it to one shot
    await page.waitForFunction(() => window.__ec!.hud().ammo === 29, undefined, { timeout: 5000 });
    await page.mouse.up();
    // shell needs ~0.4s to land, then everything in the radius takes damage
    await page.waitForFunction(
      (list) => {
        const es = window.__ec!.enemies();
        return list.every((id) => {
          const e = es.find((x) => x.uid === id);
          return !e || e.hp < 60;
        });
      },
      ids,
      { timeout: 6000 },
    );
    await page.screenshot({ path: 'e2e/out/grenade.png' });
    hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.ammo).toBe(29);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('RPG-7 rocket detonates on the first zombie it reaches', async ({ page }) => {
    const errors = await newGame(page);
    await warpToField(page);
    await prep(page);
    expect(await page.evaluate(() => window.__ec!.actions.buy('rpg7').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.buy('ammo_rocket').ok)).toBe(true);
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'rpg7')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.equipToggle(u).ok, uid)).toBe(true);
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('RPG-7');
    expect(hud.ammoKind).toBe('대전차탄');

    const zid = await page.evaluate(() => window.__ec!.spawn('zombie_suit_m', 220, 0));
    await page.waitForTimeout(150);
    const p = await page.evaluate(() => window.__ec!.player()!);
    // aim far past the zombie — the rocket must still stop at it
    const aim = await page.evaluate((pp) => window.__ec!.toScreen(pp.x + 400, pp.y)!, p);
    await page.mouse.move(aim.x, aim.y);
    await page.mouse.down();
    await page.waitForFunction(() => window.__ec!.hud().ammo === 11, undefined, { timeout: 5000 });
    await page.mouse.up();
    expect((await page.evaluate(() => window.__ec!.projectiles())).length).toBe(1);
    await page.waitForFunction((id) => {
      const e = window.__ec!.enemies().find((x) => x.uid === id);
      return !e || e.hp < 80;
    }, zid, { timeout: 6000 });
    await page.screenshot({ path: 'e2e/out/rocket.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
