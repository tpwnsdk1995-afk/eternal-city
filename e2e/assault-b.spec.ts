import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

/** booth_3 sits on tiles (39,21)–(40,22) → world centre (1280, 704) */
const BOOTH = { x: 40 * 32, y: 22 * 32 };

async function reachDefendPhase(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => window.__ec!.god(true));
  await page.evaluate(() => window.__ec!.state.events.emit('startAssault', { assaultId: 'assault-b' }));
  await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
  await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'clear');
  await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
  await page.waitForFunction(
    () => {
      window.__ec!.killAll();
      return window.__ec!.assault()?.phaseKind === 'moveTo';
    },
    null,
    { timeout: 30000, polling: 250 },
  );
  // run to the booth: stand 200px west of it (inside the zone, but far enough that attackers prefer the booth)
  await page.evaluate((b) => window.__ec!.teleport(b.x - 200, b.y), BOOTH);
  await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'defend');
}

test.describe('assault B — 중곡역 부스 방어', () => {
  test('airborne waves attack the booth; holding them off leads to the elite guard and success', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = await newGame(page);
    await reachDefendPhase(page);
    const hp0 = await page.evaluate(() => window.__ec!.assault()?.boothHp);
    expect(hp0).toBe(900);

    // the first wave reaches the booth and chips at it
    await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
    await page.waitForFunction(() => (window.__ec!.assault()?.boothHp ?? 900) < 900, null, { timeout: 40000 });
    await page.screenshot({ path: 'e2e/out/assault-b-defend.png' });

    // hold the line until the boss shows up
    await page.waitForFunction(
      () => {
        // check first: the boss spawns in the same tick the phase flips, and must not be wiped here
        if (window.__ec!.assault()?.phaseKind === 'boss') return true;
        window.__ec!.killAll();
        return false;
      },
      null,
      { timeout: 60000, polling: 250 },
    );
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'wito_elite_guard'));
    await page.screenshot({ path: 'e2e/out/assault-b-boss.png' });
    const before = await page.evaluate(() => window.__ec!.hud());
    await page.waitForFunction(
      () => {
        window.__ec!.killAll();
        return window.__ec!.assault()?.status === 'success';
      },
      null,
      { timeout: 30000, polling: 250 },
    );
    const after = await page.evaluate(() => window.__ec!.hud());
    expect(after.won).toBeGreaterThanOrEqual(before.won + 14_000);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('losing the booth fails the mission with the booth reason', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await newGame(page);
    await reachDefendPhase(page);
    await page.evaluate(() => window.__ec!.destroyObjectives());
    await page.waitForFunction(() => window.__ec!.assault()?.status === 'failed');
    expect(await page.evaluate(() => window.__ec!.assault()?.failReason)).toBe('booth');
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone', null, { timeout: 20000 });
    expect(await page.evaluate(() => window.__ec!.windows())).toContain('result');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
