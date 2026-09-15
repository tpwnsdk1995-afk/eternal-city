import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

test.describe('2004 · 의정부 레이드 — 몽골리안 데스웜', () => {
  test('2004 needs Lv.25 (or the campaign); the worm fights, burrows untargetably, erupts, and broods larvae', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setFlag('parallelPermit', true));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2004).ok)).toBe(false);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 30 }));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2004).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'technomart-shelter');

    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => window.__ec!.warp('uijeongbu', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.scene() === 'Field' && window.__ec!.hud().mapId === 'uijeongbu');
    expect((await page.evaluate(() => window.__ec!.hud())).mapName).toBe('의정부 외곽');

    const wid = (await page.evaluate(() => window.__ec!.spawn('mongolian_deathworm', 260, 0)))!;
    expect(wid).toBeTruthy();
    await page.waitForFunction((id) => window.__ec!.enemies().find((e) => e.uid === id)?.mode === 'chase', wid, { timeout: 5000 });
    // dives after ~9s on the surface
    await page.waitForFunction((id) => window.__ec!.enemies().find((e) => e.uid === id)?.mode === 'burrow', wid, { timeout: 15000 });
    await page.screenshot({ path: 'e2e/out/raid-burrow.png' });
    // ...and erupts back onto the surface
    await page.waitForFunction((id) => window.__ec!.enemies().find((e) => e.uid === id)?.mode === 'chase', wid, { timeout: 10000 });
    // the second eruption brings a larva brood
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'larva'), null, { timeout: 40000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/out/raid-eruption.png' });
    expect(await page.evaluate((id) => window.__ec!.enemies().find((e) => e.uid === id)?.hp, wid)).toBe(26_000); // the hunter never shot; the worm is untouched
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
