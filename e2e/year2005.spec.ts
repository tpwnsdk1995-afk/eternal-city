import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

test.describe('2005 · 폐허의 서울', () => {
  test('2005 opens at Lv.40 with the permit; the hub links three fields where GUEST patrol', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setFlag('parallelPermit', true));
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 39 }));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2005).ok)).toBe(false);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 40 }));
    await page.evaluate(() => window.__ec!.openWindow('parallel'));
    await page.waitForFunction(() => window.__ec!.windows().includes('parallel'));
    await page.screenshot({ path: 'e2e/out/parallel-2005.png' });
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2005).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'uijeongbu-ruins-shelter');
    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => window.__ec!.warp('uijeongbu-ruins', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'uijeongbu-ruins');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id.startsWith('guest_')), null, { timeout: 20000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/out/uijeongbu-ruins.png' });
    // the daily 2005 mainstream is offered by the hub's 과장
    await page.evaluate(() => window.__ec!.warp('uijeongbu-ruins-shelter', 'default'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'uijeongbu-ruins-shelter');
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('ms_2005_normal').ok)).toBe(true);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
