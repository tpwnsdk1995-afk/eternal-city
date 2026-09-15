import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

const T = 32;

test.describe('assault D — 패러사이트 근절', () => {
  test('GUEST waves → root nodes → membrane → 패러사이트 루트 → success', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => window.__ec!.state.events.emit('startAssault', { assaultId: 'assault-d' }));
    await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'guest_scout'), null, { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/out/assault-d-guest.png' });
    await page.waitForFunction(
      () => {
        if (window.__ec!.assault()?.phaseKind === 'advance') return true;
        window.__ec!.killAll();
        return false;
      },
      null,
      { timeout: 40000, polling: 250 },
    );
    await page.evaluate((t) => window.__ec!.teleport(50 * t, 25 * t), T);
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'destroy');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/out/assault-d-roots.png' });
    await page.evaluate(() => window.__ec!.destroyObjectives());
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'advance');
    await page.evaluate(() => window.__ec!.killAll());
    await page.evaluate((t) => window.__ec!.teleport(80 * t, 25 * t), T);
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'boss');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'parasite_root'));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/out/assault-d-root.png' });
    const before = await page.evaluate(() => window.__ec!.hud());
    await page.waitForFunction(
      () => {
        window.__ec!.killAll();
        return window.__ec!.assault()?.status === 'success';
      },
      null,
      { timeout: 30000, polling: 250 },
    );
    expect((await page.evaluate(() => window.__ec!.hud())).won).toBeGreaterThanOrEqual(before.won + 60_000);
    expect(await page.evaluate(() => window.__ec!.state.achievements.unlocked)).toContain('ach_parasite');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
