import { expect, test, type Page } from '@playwright/test';
import { newGame } from './helpers';

async function waitForScene(page: Page, key: string, timeout = 20000): Promise<void> {
  await page.waitForFunction((k) => window.__ec?.scene() === k, key, { timeout });
}

test.describe('smoke', () => {
  test('boots to title, starts a new game, renders the safe zone HUD', async ({ page }) => {
    const errors = await newGame(page, '주인공');
    await page.screenshot({ path: 'e2e/out/charcreate-done.png' });

    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.mapId).toBe('gwangjin-gucheong-parking');
    expect(hud.level).toBe(1);
    expect(hud.hp).toBeGreaterThan(0);
    expect(hud.hp).toBe(hud.hpMax);
    expect(hud.won).toBe(5000);
    expect(hud.weaponName).toBe('Glock 17');
    expect(hud.ammo).toBe(100);

    await page.screenshot({ path: 'e2e/out/safezone.png' });

    // classic scheme: left-click to the right of the player walks there
    const before = (await page.evaluate(() => window.__ec!.player()))!;
    await page.mouse.click(640 + 200, 360);
    await page.waitForFunction((bx) => (window.__ec!.player()?.x ?? 0) > bx + 60, before.x, { timeout: 5000 });

    // portal transition into 중곡동
    await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromParking'));
    await waitForScene(page, 'Field');
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'junggok-dong');
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/out/field.png' });

    // modern scheme: WASD moves the player
    await page.evaluate(() => window.__ec!.state.setSettings({ controlScheme: 'modern' }));
    const p0 = (await page.evaluate(() => window.__ec!.player()))!;
    await page.keyboard.down('d');
    await page.waitForFunction((bx) => (window.__ec!.player()?.x ?? 0) > bx + 40, p0.x, { timeout: 5000 });
    await page.keyboard.up('d');

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
