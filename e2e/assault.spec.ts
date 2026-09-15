import { expect, test } from '@playwright/test';
import { newGame as start } from './helpers';

const phaseKind = () => window.__ec!.assault()?.phaseKind ?? null;

test.describe('assault A — 중곡동 봉쇄선 돌파', () => {
  test('runs clear → destroy → gate → advance → clear → advance → boss → success with rewards', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await start(page);
    await page.evaluate(() => window.__ec!.god(true));
    const before = await page.evaluate(() => window.__ec!.hud());

    // the 접수원 dialog offers the mission; start it through the same event the button fires
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_assault' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.evaluate(() => window.__ec!.state.events.emit('startAssault', { assaultId: 'assault-a' }));
    await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'clear');

    // phase 1: two waves of recon — wait for spawns then wipe them until the phase flips
    await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
    await page.waitForFunction(
      () => {
        window.__ec!.killAll();
        return phaseKindInline() === 'destroy';
        function phaseKindInline() {
          return window.__ec!.assault()?.phaseKind ?? null;
        }
      },
      null,
      { timeout: 30000, polling: 250 },
    );

    // phase 2: barricades — shoot-through is exercised by the unit tests; here knock them down
    await page.screenshot({ path: 'e2e/out/assault-barricades.png' });
    await page.evaluate(() => window.__ec!.destroyObjectives());
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'advance');

    // phase 3: advance — walk (teleport) into stage2 through the opened gate
    await page.evaluate(() => window.__ec!.teleport(40 * 32, 20 * 32));
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'clear');

    // phase 4: airborne waves
    await page.waitForFunction(
      () => {
        window.__ec!.killAll();
        return (window.__ec!.assault()?.phaseIndex ?? 0) >= 4;
      },
      null,
      { timeout: 30000, polling: 250 },
    );
    await page.evaluate(() => window.__ec!.teleport(80 * 32, 20 * 32));
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'boss');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'zombie_lord'));
    await page.screenshot({ path: 'e2e/out/assault-boss.png' });
    await page.evaluate(() => window.__ec!.killAll());
    await page.waitForFunction(() => window.__ec!.assault()?.status === 'success');
    await page.waitForFunction(() => window.__ec!.windows().includes('result'));
    await page.screenshot({ path: 'e2e/out/assault-result.png' });

    const after = await page.evaluate(() => window.__ec!.hud());
    expect(after.won).toBeGreaterThanOrEqual(before.won + 5000);
    expect(after.level).toBeGreaterThan(before.level); // 600 XP + kills → several levels
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone', null, { timeout: 15000 });
    expect(await page.evaluate(() => window.__ec!.windows())).toContain('result');
    expect(errors, errors.join('\n')).toEqual([]);
    void phaseKind;
  });

  test('dying during the assault fails it, deducts the penalty and respawns', async ({ page }) => {
    const errors = await start(page);
    await page.evaluate(() => window.__ec!.state.events.emit('startAssault', { assaultId: 'assault-a' }));
    await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
    const won0 = await page.evaluate(() => window.__ec!.hud().won);
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) window.__ec!.spawn('zombie_stripe', 50 + i * 15, (i - 2) * 25);
    });
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone', null, { timeout: 60000 });
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.won).toBeLessThan(won0 - 400); // 500 penalty + 5% death loss
    expect(await page.evaluate(() => window.__ec!.windows())).toContain('result');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
