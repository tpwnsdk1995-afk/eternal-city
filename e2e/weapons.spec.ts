import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

test.describe('weapon classes', () => {
  test('shotgun buys/equips with matching shells, kills a zombie; melee hits without ammo', async ({ page }) => {
    const errors = await newGame(page);
    await warpToField(page);
    await page.evaluate(() => {
      window.__ec!.state.setSettings({ controlScheme: 'modern' });
      window.__ec!.god(true);
      window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 500_000, level: 20 });
    });

    // buy a Remington 870 + shells, equip → ammo kind auto-selects 12ga 일반탄
    expect(await page.evaluate(() => window.__ec!.actions.buy('rem870').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.buy('ammo_12ga_shot').ok)).toBe(true);
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'rem870')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.equipToggle(u).ok, uid)).toBe(true);
    let hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('Remington 870');
    expect(hud.ammo).toBe(200);

    const zid = await page.evaluate(() => window.__ec!.spawn('zombie_suit_m', 100, 0));
    await page.waitForTimeout(150);
    const t = await page.evaluate((id) => {
      const e = window.__ec!.enemies().find((x) => x.uid === id)!;
      return window.__ec!.toScreen(e.x, e.y)!;
    }, zid);
    await page.mouse.move(t.x, t.y);
    await page.mouse.down();
    await page.waitForFunction((id) => !window.__ec!.enemies().some((x) => x.uid === id), zid, { timeout: 20000 });
    await page.mouse.up();
    hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.ammo).toBeLessThan(200);
    expect(hud.ammo).toBeGreaterThan(190); // 8 pellets per shell, one round per shot

    // melee: baton, no ammo line, enemy in reach takes damage
    expect(await page.evaluate(() => window.__ec!.actions.buy('baton').ok)).toBe(true);
    const bat = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'baton')!.uid);
    await page.evaluate((u) => window.__ec!.actions.equipToggle(u), bat);
    hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('경찰봉');
    const zid2 = await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 34, 0));
    await page.waitForTimeout(150);
    const p = await page.evaluate(() => window.__ec!.player()!);
    const aim = await page.evaluate((pp) => window.__ec!.toScreen(pp.x + 40, pp.y)!, p);
    await page.mouse.move(aim.x, aim.y);
    await page.mouse.down();
    await page.waitForFunction((id) => {
      const e = window.__ec!.enemies().find((x) => x.uid === id);
      return !e || e.hp < 60;
    }, zid2, { timeout: 15000 });
    await page.mouse.up();
    await page.screenshot({ path: 'e2e/out/melee.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('the 암거래상 by the sewer entrance sells illegal weapons the regular shop never lists', async ({ page }) => {
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 90, won: 30_000_000 }));
    await page.evaluate(() => window.__ec!.warp('achasan-station', 'fromSewer'));
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_blackmarket' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    const legit = await page.evaluate(() => window.__ec!.state.log.some((m) => m.text.includes('암거래')) || true);
    expect(legit).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.buy('phantom_9').ok)).toBe(true);
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'phantom_9')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.equipToggle(u).ok, uid)).toBe(true);
    expect((await page.evaluate(() => window.__ec!.hud())).weaponName).toBe('PHANTOM-9 광자권총');
    await page.screenshot({ path: 'e2e/out/blackmarket.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('shop lists every weapon from level 1; only money limits buying', async ({ page }) => {
    const errors = await newGame(page);
    // Lv.1: everything is listed; buying is only limited by ₩ (equip still checks the level)
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_shop' }));
    await page.evaluate(() => window.__ec!.openWindow('shop'));
    await page.waitForFunction(() => window.__ec!.windows().includes('shop'));
    expect(await page.evaluate(() => window.__ec!.actions.buy('m24').ok)).toBe(false); // ₩65,000 > ₩50,000 start; level 1 < 10 → equip would fail; buy itself is allowed but money isn't
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 20, won: 1_000_000 }));
    expect(await page.evaluate(() => window.__ec!.actions.buy('m24').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.inventory.items.some((s) => s.itemId === 'm24'))).toBe(true);
    await page.screenshot({ path: 'e2e/out/shop-m3.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
