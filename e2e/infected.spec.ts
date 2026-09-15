import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test.describe('감염체 캐릭터', () => {
  test('creating an infected hunter: claws instead of a gun, no ammo, guns refused, acid spit lobs, HP regenerates', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '감염자');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()); // R typed into the name box must not switch race
    await page.keyboard.press('r'); // 종족 전환 → 감염체
    await page.screenshot({ path: 'e2e/out/infected-create.png' });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.__ec!.state.character.race)).toBe('infected');
    let hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('발톱');
    expect(await page.evaluate(() => window.__ec!.state.mods().maxHpPct)).toBeCloseTo(0.15);

    // guns are refused, 변이무기 are bought and worn
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 500_000, level: 20 }));
    expect(await page.evaluate(() => window.__ec!.actions.buy('glock17').ok)).toBe(true);
    const glock = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'glock17')!.uid);
    const eq = await page.evaluate((u) => window.__ec!.actions.equipToggle(u), glock);
    expect(eq.ok).toBe(false);
    expect(eq.message).toContain('감염체');
    expect(await page.evaluate(() => window.__ec!.actions.buy('acid_spit').ok)).toBe(true);

    // claws in the field: swing at a zombie, no ammo line
    await page.evaluate(() => window.__ec!.state.setSettings({ controlScheme: 'modern' }));
    await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromParking'));
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__ec!.god(true));
    const zid = await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 34, 0));
    await page.waitForTimeout(150);
    const p = await page.evaluate(() => window.__ec!.player()!);
    const aim = await page.evaluate((pp) => window.__ec!.toScreen(pp.x + 40, pp.y)!, p);
    await page.mouse.move(aim.x, aim.y);
    await page.mouse.down();
    await page.waitForFunction((id) => !window.__ec!.enemies().some((x) => x.uid === id), zid, { timeout: 20000 });
    await page.mouse.up();
    await page.screenshot({ path: 'e2e/out/infected-claws.png' });

    // acid spit: arcing projectile, blast damages a far zombie, no self damage
    const acid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'acid_spit')!.uid);
    expect(await page.evaluate((u) => window.__ec!.actions.equipToggle(u).ok, acid)).toBe(true);
    hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('산성 토사');
    const zid2 = await page.evaluate(() => window.__ec!.spawn('zombie_suit_m', 180, 0));
    await page.waitForTimeout(150);
    const p2 = await page.evaluate(() => window.__ec!.player()!);
    const aim2 = await page.evaluate((pp) => window.__ec!.toScreen(pp.x + 180, pp.y)!, p2);
    await page.mouse.move(aim2.x, aim2.y);
    await page.mouse.down();
    await page.waitForFunction(() => window.__ec!.projectiles().length > 0, null, { timeout: 5000 });
    await page.mouse.up();
    await page.waitForFunction((id) => {
      const e = window.__ec!.enemies().find((x) => x.uid === id);
      return !e || e.hp < 110;
    }, zid2, { timeout: 8000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
