import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

test.describe('패러렐 시스템 — 2003 종로', () => {
  test('the permit gates year travel; 2003 has its own hub, street, monsters, HUD year and taxi network', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = await newGame(page);
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2003).ok)).toBe(false);
    await page.evaluate(() => window.__ec!.state.setFlag('parallelPermit', true));

    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_parallel' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.evaluate(() => window.__ec!.openWindow('parallel'));
    await page.waitForFunction(() => window.__ec!.windows().includes('parallel'));
    await page.screenshot({ path: 'e2e/out/parallel.png' });

    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2003).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'jongno-shelter');
    expect(await page.evaluate(() => window.__ec!.scene())).toBe('SafeZone');
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2003).ok)).toBe(false); // already here

    // out to the street: 2003 monsters roam
    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => window.__ec!.warp('jongno-street', 'fromShelter'));
    await page.waitForFunction(() => window.__ec!.scene() === 'Field' && window.__ec!.hud().mapId === 'jongno-street');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => ['zombie_police', 'zombie_firefighter', 'wito_engineer', 'wito_turret'].includes(e.id)), null, { timeout: 20000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/out/jongno.png' });

    // taxis stay inside the year
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 100_000, level: 30 }));
    expect(await page.evaluate(() => window.__ec!.actions.taxiRegister().ok)).toBe(true);
    await page.evaluate(() => window.__ec!.state.setFlag('taxi:junggok-dong', true));
    const ride = await page.evaluate(() => window.__ec!.actions.taxiRide('junggok-dong'));
    expect(ride.ok).toBe(false);
    expect(ride.message).toContain('같은 연도');

    // back to 2002 through the system
    expect(await page.evaluate(() => window.__ec!.actions.travelYear(2002).ok)).toBe(true);
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'gwangjin-gucheong-parking');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
