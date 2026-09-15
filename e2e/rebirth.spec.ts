import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

test.describe('환생', () => {
  test('EL.IA refuses below Lv.50; at Lv.50 rebirth resets to Lv.1 with a higher cap, bonus points, kept gear/₩ and an achievement', async ({ page }) => {
    const errors = await newGame(page);
    expect(await page.evaluate(() => window.__ec!.actions.rebirth().ok)).toBe(false);
    await page.evaluate(() => {
      const c = window.__ec!.state.character;
      window.__ec!.state.setCharacter({ ...c, level: 50, won: 123_456, base: { ...c.base, 기술: 40 } });
    });
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_elia' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.screenshot({ path: 'e2e/out/rebirth-dialog.png' });
    expect(await page.evaluate(() => window.__ec!.actions.rebirth().ok)).toBe(true);
    const c = await page.evaluate(() => window.__ec!.state.character);
    expect(c.level).toBe(1);
    expect(c.rebirth).toBe(1);
    expect(c.base['기술']).toBe(0);
    expect(c.unspentPoints).toBe(15);
    expect(c.won).toBeGreaterThanOrEqual(123_456); // kept (plus the achievement's ₩)
    expect(await page.evaluate(() => window.__ec!.hud().weaponName)).toBe('Glock 17'); // gear stays
    expect(await page.evaluate(() => window.__ec!.state.achievements.unlocked)).toContain('ach_rebirth_1');
    expect(await page.evaluate(() => window.__ec!.state.achievements.title)).toBe('환생자');
    await page.evaluate(() => window.__ec!.openWindow('status'));
    await page.waitForFunction(() => window.__ec!.windows().includes('status'));
    await page.screenshot({ path: 'e2e/out/rebirth-status.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
