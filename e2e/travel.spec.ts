import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

test.describe('taxi + vending', () => {
  test('register two stands, ride between them, and get refused for unregistered / far stops', async ({ page }) => {
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 20_000 }));

    // 운송조합원 dialog in the parking garage
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_taxi' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    expect(await page.evaluate(() => window.__ec!.actions.taxiRide('junggok-dong').ok)).toBe(false); // here not registered
    expect(await page.evaluate(() => window.__ec!.actions.taxiRegister().ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.taxiRegister().ok)).toBe(false); // already
    expect(await page.evaluate(() => window.__ec!.actions.taxiRide('junggok-dong').ok)).toBe(false); // destination not registered
    await page.evaluate(() => window.__ec!.openWindow('taxi'));
    await page.screenshot({ path: 'e2e/out/taxi.png' });

    await warpToField(page);
    expect(await page.evaluate(() => window.__ec!.actions.taxiRegister().ok)).toBe(true);
    const won0 = await page.evaluate(() => window.__ec!.hud().won);
    expect(await page.evaluate(() => window.__ec!.actions.taxiRide('gwangjin-gucheong-parking').ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone');
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.mapId).toBe('gwangjin-gucheong-parking');
    expect(hud.won).toBe(won0 - 900);
    // 평창동 is level gated
    await page.evaluate(() => window.__ec!.state.setFlag('taxi:pyeongchang-dong', true));
    expect(await page.evaluate(() => window.__ec!.actions.taxiRide('pyeongchang-dong').ok)).toBe(false);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 15 }));
    expect(await page.evaluate(() => window.__ec!.actions.taxiRide('pyeongchang-dong').ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'pyeongchang-dong');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'e2e/out/pyeongchang.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('vending machines sell 진통제 which heals', async ({ page }) => {
    const errors = await newGame(page);
    // stand next to the vending machines in the garage (tiles 34,4 / 35,4) and press E
    await page.evaluate(() => {
      window.__ec!.state.setSettings({ controlScheme: 'modern' });
      window.__ec!.teleport(34 * 32 + 16, 6 * 32);
    });
    await page.waitForTimeout(200);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    const hp0 = 30;
    await page.evaluate((h) => window.__ec!.state.setVitals({ hp: h }), hp0);
    expect(await page.evaluate(() => window.__ec!.actions.buy('painkiller').ok)).toBe(true);
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'painkiller')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.use(u).ok, uid)).toBe(true);
    // safe-zone regen also ticks, so only assert the jump
    expect(await page.evaluate(() => window.__ec!.hud().hp)).toBeGreaterThanOrEqual(hp0 + 15);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
