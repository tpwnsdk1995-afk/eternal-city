import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

/**
 * Keyboard/mobile control fixes: WASD moves under the default 원작식 scheme, and the title screen's
 * T key forces the touch layer on for phones the auto-detect misses (persisted across a reload).
 */
test.describe('controls', () => {
  test('WASD moves the character under the classic scheme', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '와사드');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__ec!.state.settings.controlScheme)).toBe('classic');

    const before = await page.evaluate(() => ({ x: window.__ec!.player()!.x, y: window.__ec!.player()!.y }));
    await page.mouse.move(640, 360);
    // headless runs the world well under real-time, so wait for the distance rather than a fixed hold
    await page.keyboard.down('d');
    await page.waitForFunction((bx) => (window.__ec!.player()?.x ?? 0) > bx + 30, before.x, { timeout: 8000 });
    await page.keyboard.up('d');
    await page.waitForTimeout(150);
    const afterD = await page.evaluate(() => ({ x: window.__ec!.player()!.x, y: window.__ec!.player()!.y }));
    expect(afterD.x).toBeGreaterThan(before.x + 30);
    await page.waitForTimeout(300);
    expect(Math.abs((await page.evaluate(() => window.__ec!.player()!.x)) - afterD.x)).toBeLessThan(8); // released → stopped

    await page.keyboard.down('w');
    await page.waitForFunction((by) => (window.__ec!.player()?.y ?? 0) < by - 30, afterD.y, { timeout: 8000 });
    await page.keyboard.up('w');
    await page.waitForTimeout(150);
    const afterW = await page.evaluate(() => ({ x: window.__ec!.player()!.x, y: window.__ec!.player()!.y }));
    expect(afterW.y).toBeLessThan(afterD.y - 30);
    // click-to-move still works afterwards (classic behaviour untouched)
    const target = (await page.evaluate(() => window.__ec!.toScreen(window.__ec!.player()!.x - 120, window.__ec!.player()!.y)))!;
    await page.mouse.move(target.x, target.y);
    await page.waitForTimeout(80);
    await page.mouse.down();
    await page.waitForTimeout(60);
    await page.mouse.up();
    await page.waitForFunction((bx) => (window.__ec!.player()?.x ?? 0) < bx - 60, afterW.x, { timeout: 8000 });
    await page.screenshot({ path: 'e2e/out/controls-wasd-classic.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('title T toggles the touch layer on for a desktop session and it survives a reload', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__ec!.state.settings.touchControls)).toBe('auto');
    await page.keyboard.press('t');
    await page.waitForFunction(() => window.__ec!.state.settings.touchControls === 'on');
    await page.screenshot({ path: 'e2e/out/title-touch-on.png' });

    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForFunction(() => window.__ec!.state.settings.touchControls === 'on', null, { timeout: 5000 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '터치강제');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => window.__ec!.touch()))!.enabled).toBe(true);
    await page.screenshot({ path: 'e2e/out/title-touch-forced-safezone.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
