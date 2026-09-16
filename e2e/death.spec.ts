import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

/** 사망 → 구청 지하 부활, 파손/수리, 파방클. */
test.describe('death · 파손 · 파방클', () => {
  test('dying respawns in the hub at half HP with a ₩ loss; a damaged weapon is repaired at the 기술상', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = await newGame(page, '불사조');
    await warpToField(page);
    const won0 = (await page.evaluate(() => window.__ec!.hud())).won;
    // a boss on top of a 1-HP hunter
    await page.evaluate(() => window.__ec!.state.setVitals({ hp: 1 }));
    await page.evaluate(() => window.__ec!.spawn('zombie_lord', 24, 0));
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone', null, { timeout: 30000 });
    await page.waitForTimeout(400);
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.mapId).toBe('gwangjin-gucheong-parking');
    expect(hud.hp).toBeLessThanOrEqual(Math.ceil(hud.hpMax * 0.5) + 1);
    expect(hud.won).toBeLessThanOrEqual(won0);
    expect(await page.evaluate(() => window.__ec!.state.stats.deaths)).toBe(1);
    const damagedCount = await page.evaluate(() => window.__ec!.state.inventory.items.filter((s) => s.damaged).length);
    expect(damagedCount).toBeLessThanOrEqual(1); // at most one piece breaks per death

    // force a damaged Glock and repair it through the action the 기술상 button calls
    await page.evaluate(() => {
      const s = window.__ec!.state;
      const g = s.inventory.items.find((x) => x.itemId === 'glock17')!;
      s.setInventory({ ...s.inventory, items: s.inventory.items.map((x) => (x.uid === g.uid ? { ...x, damaged: true } : x)) });
      s.setEquipment({ ...s.equipment });
      s.setCharacter({ ...s.character, won: 100_000 });
    });
    expect((await page.evaluate(() => window.__ec!.hud())).weaponLabel).toContain('[파손]');
    await page.evaluate(() => window.__ec!.openShop('npc_tech'));
    await page.evaluate(() => window.__ec!.closeWindows());
    await page.evaluate(() => window.__ec!.openWindow('tuning'));
    await page.waitForFunction(() => window.__ec!.windows().includes('tuning'));
    expect(await page.evaluate(() => window.__ec!.buttonPos('tuning', '수리'))).not.toBeNull();
    await page.screenshot({ path: 'e2e/out/tuning-repair.png' });
    const g = await page.evaluate(() => window.__ec!.state.inventory.items.find((x) => x.itemId === 'glock17')!.uid);
    const wonBefore = await page.evaluate(() => window.__ec!.hud().won);
    expect(await page.evaluate((u) => window.__ec!.actions.repair(u).ok, g)).toBe(true);
    expect((await page.evaluate(() => window.__ec!.hud())).weaponLabel).not.toContain('[파손]');
    expect(await page.evaluate(() => window.__ec!.hud().won)).toBeLessThan(wonBefore);
    expect(await page.evaluate((u) => window.__ec!.actions.repair(u).ok, g)).toBe(false); // nothing to repair

    // 파방클 from the 사이버샵 gives a 7-day buff
    expect(await page.evaluate(() => window.__ec!.actions.buy('pabang_clip').ok)).toBe(true);
    const clip = await page.evaluate(() => window.__ec!.state.inventory.items.find((x) => x.itemId === 'pabang_clip')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.use(u).ok, clip)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.buffs.active.some((b) => b.id === 'buff_pabang_clip'))).toBe(true);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
