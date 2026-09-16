import { expect, test } from '@playwright/test';
import { clickAt, newGame } from './helpers';

test.describe('구청 보관함 · 인벤토리 정렬/필터', () => {
  test('deposit removes weight, withdraw respects the limit, and the 보관함 survives a reload', async ({ page }) => {
    const errors = await newGame(page, '창고맨');
    await page.evaluate(() => {
      window.__ec!.give('m60', 1); // 10.5kg
      window.__ec!.give('bandage', 5);
    });
    const kg0 = await page.evaluate(() => window.__ec!.hud().weightKg);

    // talk to the 보관소 NPC → dialog offers the 보관함
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_storage' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__ec!.openWindow('storage'));
    await page.waitForFunction(() => window.__ec!.windows().includes('storage'));

    // equipped Glock cannot be stored; the M60 can
    const glock = await page.evaluate(() => window.__ec!.state.equipment.weaponUid!);
    expect(await page.evaluate((u) => window.__ec!.actions.deposit(u).ok, glock)).toBe(false);
    const m60 = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'm60')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.deposit(u).ok, m60)).toBe(true);
    const kg1 = await page.evaluate(() => window.__ec!.hud().weightKg);
    expect(kg1).toBeLessThan(kg0 - 10);
    expect(await page.evaluate(() => window.__ec!.state.storage.items.map((s) => s.itemId))).toEqual(['m60']);

    // consumables merge: two deposits of bandages end up in one slot
    const b1 = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'bandage')!);
    await page.evaluate((u) => window.__ec!.actions.deposit(u), b1.uid);
    await page.evaluate(() => window.__ec!.give('bandage', 2));
    const b2 = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'bandage')!.uid);
    await page.evaluate((u) => window.__ec!.actions.deposit(u), b2);
    expect(await page.evaluate(() => window.__ec!.state.storage.items.filter((s) => s.itemId === 'bandage').map((s) => s.qty))).toEqual([b1.qty + 2]);
    await page.screenshot({ path: 'e2e/out/storage.png' });

    // withdraw the M60 again, then put it back and save
    const stored = await page.evaluate(() => window.__ec!.state.storage.items.find((s) => s.itemId === 'm60')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.withdraw(u).ok, stored)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.hud().weightKg)).toBeGreaterThan(kg1 + 9); // bandages (0.7kg) went in meanwhile
    const again = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'm60')!.uid);
    await page.evaluate((u) => window.__ec!.actions.deposit(u), again);
    await page.evaluate(() => window.__ec!.save());

    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500);
    await page.keyboard.press('c');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    expect(await page.evaluate(() => window.__ec!.state.storage.items.map((s) => s.itemId).sort())).toEqual(['bandage', 'm60']);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('inventory filter tabs and the sort toggle re-render the list', async ({ page }) => {
    const errors = await newGame(page);
    await page.evaluate(() => {
      window.__ec!.give('m60', 1);
      window.__ec!.give('ammo_9mm_incendiary', 1);
    });
    await page.keyboard.press('i');
    await page.waitForFunction(() => window.__ec!.windows().includes('inventory'));
    await clickAt(page, await page.evaluate(() => window.__ec!.buttonPos('inventory', '무기')));
    await page.waitForTimeout(150);
    await clickAt(page, await page.evaluate(() => window.__ec!.buttonPos('inventory', '정렬')));
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__ec!.buttonPos('inventory', '정렬: 이름'))).not.toBeNull();
    await page.screenshot({ path: 'e2e/out/inventory-filter.png' });
    await clickAt(page, await page.evaluate(() => window.__ec!.buttonPos('inventory', '탄약')));
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.__ec!.windows())).toEqual(['inventory']);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
