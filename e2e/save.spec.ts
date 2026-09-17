import { expect, test } from '@playwright/test';
import { newGame, watchErrors } from './helpers';

test.describe('save / load', () => {
  test('progress survives a reload through 계속하기', async ({ page }) => {
    const errors = await newGame(page, '세이브맨');
    await page.evaluate(() => {
      window.__ec!.actions.allocate('속도', 5);
      window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 77_777, level: 10 }); // UZI needs Lv.4
      window.__ec!.actions.buy('uzi');
    });
    const uzi = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'uzi')!.uid);
    await page.evaluate((u) => window.__ec!.actions.equipToggle(u), uzi);
    await page.evaluate(() => window.__ec!.state.setSettings({ controlScheme: 'modern' }));
    await page.evaluate(() => window.__ec!.save());
    expect(await page.evaluate(() => window.__ec!.hasSave())).toBe(true);

    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500); // title fetches the save row
    await page.keyboard.press('c');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.weaponName).toBe('IMI UZI');
    expect(hud.won).toBeLessThan(77_777);
    expect(await page.evaluate(() => window.__ec!.state.character.name)).toBe('세이브맨');
    expect(await page.evaluate(() => window.__ec!.state.character.base['속도'])).toBe(5);
    expect(await page.evaluate(() => window.__ec!.state.settings.controlScheme)).toBe('modern');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('Esc opens the menu, toggles the control scheme, and returns to title with a save', async ({ page }) => {
    const errors = await newGame(page);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ec!.windows().includes('menu'));
    await page.screenshot({ path: 'e2e/out/menu.png' });
    await page.evaluate(() => window.__ec!.state.setSettings({ controlScheme: 'modern' }));
    await page.evaluate(() => window.__ec!.state.events.emit('goTitle', undefined));
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    expect(await page.evaluate(() => window.__ec!.hasSave())).toBe(true);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a fresh profile has no continue option', async ({ page }) => {
    watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    expect(await page.evaluate(() => window.__ec!.hasSave())).toBe(false);
    await page.screenshot({ path: 'e2e/out/title.png' });
  });
});
