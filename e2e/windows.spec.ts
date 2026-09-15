import { expect, test, type Page } from '@playwright/test';
import type {} from '../src/debug/exposeDebug';

async function startInSafeZone(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await page.waitForFunction(() => window.__ec?.scene() === 'Title');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
  await page.waitForTimeout(300);
  return errors;
}

test.describe('windows', () => {
  test('hotkeys toggle inventory/status/skills and Esc closes the top window', async ({ page }) => {
    const errors = await startInSafeZone(page);
    await page.keyboard.press('i');
    await page.waitForFunction(() => window.__ec!.windows().includes('inventory'));
    await page.keyboard.press('c'); // classic: status
    await page.waitForFunction(() => window.__ec!.windows().includes('status'));
    await page.keyboard.press('k');
    await page.waitForFunction(() => window.__ec!.windows().includes('skills'));
    await page.screenshot({ path: 'e2e/out/windows.png' });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__ec!.windows().includes('skills'));
    expect(await page.evaluate(() => window.__ec!.windows())).toEqual(['inventory', 'status']);
    await page.keyboard.press('i');
    await page.waitForFunction(() => !window.__ec!.windows().includes('inventory'));
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('stat allocation raises max HP; shop buy/sell and skill learning move ₩', async ({ page }) => {
    const errors = await startInSafeZone(page);
    const before = await page.evaluate(() => window.__ec!.hud());
    expect(await page.evaluate(() => window.__ec!.state.character.unspentPoints)).toBe(5);

    await page.evaluate(() => window.__ec!.actions.allocate('체력', 5));
    const after = await page.evaluate(() => window.__ec!.hud());
    expect(after.hpMax).toBe(before.hpMax + 40);
    expect(await page.evaluate(() => window.__ec!.state.character.unspentPoints)).toBe(0);
    expect(await page.evaluate(() => window.__ec!.actions.allocate('체력', 1).ok)).toBe(false);

    // shop: talk to the 무기상 → dialog → buy ammo → sell it back
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_shop' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    const won0 = after.won;
    const r = await page.evaluate(() => window.__ec!.actions.buy('ammo_9mm_incendiary'));
    expect(r.ok).toBe(true);
    const hud1 = await page.evaluate(() => window.__ec!.hud());
    expect(hud1.won).toBeLessThan(won0);
    // select the incendiary box for the equipped Glock → HUD ammo count switches to that kind
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'ammo_9mm_incendiary')!.uid);
    await page.evaluate((u) => window.__ec!.actions.selectAmmo(u), uid);
    expect(await page.evaluate(() => window.__ec!.state.fire.ammoKind)).toBe('소이탄');
    await page.evaluate((u) => window.__ec!.actions.sell(u), uid);
    const hud2 = await page.evaluate(() => window.__ec!.hud());
    expect(hud2.won).toBeGreaterThan(hud1.won);
    expect(hud2.won).toBeLessThan(won0);

    // skills: can't afford 강인한 체력? (₩5,000 at start minus purchase) → give money then learn + activate
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 50_000 }));
    expect(await page.evaluate(() => window.__ec!.actions.learnSkill('skill_tough_body').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.toggleSkill('skill_tough_body').ok)).toBe(true);
    const hud3 = await page.evaluate(() => window.__ec!.hud());
    expect(hud3.hpMax).toBeGreaterThan(after.hpMax);

    // unequip → no weapon; re-equip
    const glockUid = await page.evaluate(() => window.__ec!.state.equipment.weaponUid!);
    await page.evaluate((u) => window.__ec!.actions.equipToggle(u), glockUid);
    expect(await page.evaluate(() => window.__ec!.hud().weaponName)).toBeNull();
    await page.evaluate((u) => window.__ec!.actions.equipToggle(u), glockUid);
    expect(await page.evaluate(() => window.__ec!.hud().weaponName)).toBe('Glock 17');

    await page.evaluate(() => window.__ec!.openWindow('shop'));
    await page.screenshot({ path: 'e2e/out/shop.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
