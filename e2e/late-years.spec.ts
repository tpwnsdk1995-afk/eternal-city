import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

/** 2006 강남 · 2008 여의도 · 2017 현재 — unlock ladder, hubs, fields with their monsters, mainstreams. */
test.describe('2006 · 2008 · 2017', () => {
  test('the late years unlock by level, each hub reaches its two fields, and the raid boss lives on 남산', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setFlag('parallelPermit', true));
    await page.evaluate(() => window.__ec!.god(true));

    // ladder: 2006 at 50, 2008 at 65, 2017 at 80
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 49 }));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2006).ok)).toBe(false);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 50 }));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2008).ok)).toBe(false);
    await page.evaluate(() => window.__ec!.openWindow('parallel'));
    await page.waitForFunction(() => window.__ec!.windows().includes('parallel'));
    await page.screenshot({ path: 'e2e/out/parallel-late.png' });
    await page.evaluate(() => window.__ec!.closeWindows());
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2006).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'gangnam-shelter');
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('ms_2006_normal').ok)).toBe(true);

    // 2006 fields
    await page.evaluate(() => window.__ec!.warp('teheran-ro', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'teheran-ro');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => ['zombie_office', 'wito_heavy_gunner', 'guest_hunter', 'zombie_ceo'].includes(e.id)), null, { timeout: 20000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/out/teheran-ro.png' });
    await page.evaluate(() => window.__ec!.warp('coex-mall', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'coex-mall');
    expect((await page.evaluate(() => window.__ec!.audio())).ambient).toBe('dark');

    // 2008
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 65 }));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2008).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'yeouido-shelter');
    await page.evaluate(() => window.__ec!.warp('national-assembly', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'national-assembly');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => ['wito_drone', 'zombie_riot_police', 'wito_heavy_gunner', 'parasite_spawn', 'wito_commander'].includes(e.id)), null, { timeout: 20000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/out/national-assembly.png' });

    // 2017 + raid boss spawn (debug) uses the burrower brain like the deathworm
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 80 }));
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2017).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'seoul-station-shelter');
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('ms_2017_normal').ok)).toBe(true);
    await page.evaluate(() => window.__ec!.warp('namsan', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'namsan');
    const uid = await page.evaluate(() => window.__ec!.spawn('the_wise_one', 220, 0));
    expect(uid).not.toBeNull();
    await page.waitForFunction((u) => window.__ec!.enemies().some((e) => e.uid === u), uid, { timeout: 5000 });
    const boss = await page.evaluate((u) => window.__ec!.enemies().find((e) => e.uid === u)!, uid);
    expect(boss.hp).toBe(300_000);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/out/namsan-wise-one.png' });

    // every late map round-trips its portal back to the hub (validated at boot; spot-check one)
    await page.evaluate(() => window.__ec!.warp('seoul-station-shelter', 'fromWest'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'seoul-station-shelter');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
