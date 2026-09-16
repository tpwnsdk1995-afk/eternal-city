import { expect, test, type Page } from '@playwright/test';
import { watchErrors } from './helpers';

/**
 * Mobile touch controls. `?touch=1` forces the on-screen layer on a desktop browser; mouse drags
 * stand in for finger drags (Phaser treats both as pointers), so the checks are about intent
 * routing — stick → movement, fire button → shots, action buttons → jump/interact/hotkeys.
 */
async function newGameTouch(page: Page): Promise<string[]> {
  const errors = watchErrors(page);
  await page.goto('/?touch=1');
  await page.waitForFunction(() => window.__ec?.scene() === 'Title');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
  await page.fill('#ec-name', '터치테스터');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
  await page.waitForTimeout(300);
  return errors;
}

test.describe('touch controls', () => {
  test('stick moves (and runs), fire button shoots with auto-aim, buttons route to actions', async ({ page }) => {
    const errors = await newGameTouch(page);

    const layout = (await page.evaluate(() => window.__ec!.touch()))!;
    expect(layout.enabled).toBe(true);
    await page.screenshot({ path: 'e2e/out/touch-safezone.png' });

    // --- stick: drag right → player moves right (classic scheme is still active) -------------
    const p0 = (await page.evaluate(() => window.__ec!.player()))!;
    await page.mouse.move(layout.stick.x, layout.stick.y);
    await page.mouse.down();
    await page.mouse.move(layout.stick.x + 30, layout.stick.y, { steps: 4 });
    await page.waitForFunction((bx) => (window.__ec!.player()?.x ?? 0) > bx + 40, p0.x, { timeout: 5000 });
    const walkHud = await page.evaluate(() => window.__ec!.hud());
    // push to the rim → running drains stamina
    await page.mouse.move(layout.stick.x + 80, layout.stick.y, { steps: 4 });
    await page.waitForFunction((st) => window.__ec!.hud().stamina < st - 2, walkHud.stamina, { timeout: 5000 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const p1 = (await page.evaluate(() => window.__ec!.player()))!;
    await page.waitForTimeout(300);
    const p2 = (await page.evaluate(() => window.__ec!.player()))!;
    expect(Math.abs(p2.x - p1.x)).toBeLessThan(8); // released → stopped

    // --- into the field, spawn a target off to the left, hold fire with no drag → auto-aim ---
    await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromParking'));
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__ec!.god(true));
    const uid = await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', -140, 0));
    expect(uid).not.toBeNull();
    const hp0 = await page.evaluate((u) => window.__ec!.enemies().find((e) => e.uid === u)?.hp ?? 0, uid);
    const ammo0 = (await page.evaluate(() => window.__ec!.hud())).ammo;

    await page.mouse.move(layout.fire.x, layout.fire.y);
    await page.mouse.down();
    await page.waitForFunction((a) => window.__ec!.hud().ammo < a, ammo0, { timeout: 5000 });
    await page.waitForFunction(
      ([u, h]) => {
        const e = window.__ec!.enemies().find((x) => x.uid === u);
        return !e || e.hp < (h as number);
      },
      [uid, hp0] as const,
      { timeout: 8000 },
    );
    await page.mouse.up();
    const hp1 = await page.evaluate((u) => window.__ec!.enemies().find((e) => e.uid === u)?.hp ?? 0, uid);
    expect(hp1).toBeLessThan(hp0); // shots landed on the auto-aimed target behind us
    await page.screenshot({ path: 'e2e/out/touch-field-fire.png' });

    // --- fire-stick drag: aim direction follows the drag, still shoots -----------------------
    const ammo1 = (await page.evaluate(() => window.__ec!.hud())).ammo;
    await page.mouse.move(layout.fire.x, layout.fire.y);
    await page.mouse.down();
    await page.mouse.move(layout.fire.x + 50, layout.fire.y - 10, { steps: 3 });
    await page.waitForFunction((a) => window.__ec!.hud().ammo < a, ammo1, { timeout: 5000 });
    await page.mouse.up();

    // --- action buttons: 점프 costs stamina, 인벤 tab opens the inventory ----------------------
    const stBefore = (await page.evaluate(() => window.__ec!.hud())).stamina;
    await page.mouse.click(layout.buttons['점프'].x, layout.buttons['점프'].y);
    await page.waitForFunction((st) => window.__ec!.hud().stamina < st - 5, stBefore, { timeout: 3000 });

    await page.mouse.click(640 - 3 * 68 - 34 + 32, 8 + 15); // first tab (인벤) in the top strip
    await page.waitForFunction(() => window.__ec!.windows().includes('inventory'), undefined, { timeout: 3000 });
    await page.screenshot({ path: 'e2e/out/touch-inventory.png' });
    await page.evaluate(() => window.__ec!.closeWindows());

    // --- HUD quickslot tap = number key: a bandage in slot 1 heals when the slot is tapped ------
    await page.evaluate(() => window.__ec!.give('bandage', 3));
    await page.evaluate(() => window.__ec!.state.setVitals({ hp: 10 }));
    await page.mouse.click(590 + 23, 720 - 78 + 8 + 31); // quickslot 1 well (HUD_BAR_H strip, see UIScene)
    await page.waitForFunction(() => window.__ec!.hud().hp > 10, undefined, { timeout: 3000 });

    // --- setting toggles the layer off and on -----------------------------------------------
    await page.evaluate(() => window.__ec!.state.setSettings({ touchControls: 'off' }));
    expect((await page.evaluate(() => window.__ec!.touch()))!.enabled).toBe(false);
    await page.evaluate(() => window.__ec!.state.setSettings({ touchControls: 'on' }));
    expect((await page.evaluate(() => window.__ec!.touch()))!.enabled).toBe(true);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('touch layer stays hidden on a plain desktop session', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '데스크톱');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => window.__ec!.touch()))!.enabled).toBe(false);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
