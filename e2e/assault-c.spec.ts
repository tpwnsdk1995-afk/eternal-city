import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

const T = 32;
const CHAMBER = { x: 63 * T, y: 20 * T };
const EXIT = { x: 85 * T, y: 20 * T };

test.describe('assault C — 하수도 심층 (보스 사냥형) + 고급 변형 + 접수 창', () => {
  test('timed entry → clear → 변종 오구린 → timed extraction → success', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => window.__ec!.state.events.emit('startAssault', { assaultId: 'assault-c' }));
    await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'moveTo');
    await page.evaluate((c) => window.__ec!.teleport(c.x, c.y), CHAMBER);
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'clear');
    await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
    await page.waitForFunction(
      () => {
        if (window.__ec!.assault()?.phaseKind === 'boss') return true;
        window.__ec!.killAll();
        return false;
      },
      null,
      { timeout: 40000, polling: 250 },
    );
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'ogurin_mutant'));
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/out/assault-c-boss.png' });
    await page.waitForFunction(
      () => {
        if (window.__ec!.assault()?.phaseKind === 'moveTo') return true;
        window.__ec!.killAll();
        return false;
      },
      null,
      { timeout: 40000, polling: 250 },
    );
    const before = await page.evaluate(() => window.__ec!.hud());
    await page.evaluate((c) => window.__ec!.teleport(c.x, c.y), EXIT);
    await page.waitForFunction(() => window.__ec!.assault()?.status === 'success');
    const after = await page.evaluate(() => window.__ec!.hud());
    expect(after.won).toBeGreaterThanOrEqual(before.won + 30_000);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('the reception board shows 고급 variants, and deploys the advanced mission with scaled monsters', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_assault' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.evaluate(() => window.__ec!.openWindow('assault'));
    await page.waitForFunction(() => window.__ec!.windows().includes('assault'));
    await page.screenshot({ path: 'e2e/out/assault-board.png' });
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 25 }));
    await page.evaluate(() => window.__ec!.god(true));
    // 고급 A: same phases, tougher enemies
    await page.evaluate(() => window.__ec!.state.events.emit('startAssault', { assaultId: 'assault-a-adv' }));
    await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
    await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
    const hp = await page.evaluate(() => Math.max(...window.__ec!.enemies().map((e) => e.hp)));
    expect(hp).toBeGreaterThanOrEqual(Math.round(160 * 1.7)); // wito_recon 160 → 272
    expect(await page.evaluate(() => window.__ec!.assault()?.id)).toBe('assault-a-adv');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
