import { expect, test, type Page } from '@playwright/test';
import { newGame } from './helpers';

/** 어설트 E (코엑스 지하, 기물 파괴 전진) · F (광화문 부스 방어) — late-year instances on the proven footprints. */
async function startAssault(page: Page, id: string, level: number): Promise<void> {
  await page.evaluate((lv) => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: lv }), level);
  await page.evaluate(() => window.__ec!.god(true));
  await page.evaluate((a) => window.__ec!.startAssault(a), id);
  await page.waitForFunction(() => window.__ec!.scene() === 'Assault');
  await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'clear');
}

/** Wipe spawns every poll until the phase index passes `index`. */
async function clearUntilPhase(page: Page, index: number): Promise<void> {
  await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
  await page.waitForFunction(
    (i) => {
      window.__ec!.killAll();
      return (window.__ec!.assault()?.phaseIndex ?? 0) >= i;
    },
    index,
    { timeout: 45000, polling: 250 },
  );
}

test.describe('assault E · F', () => {
  test('E: vents → gate → heavy gunners → 회장 좀비, on the dark 코엑스 corridor', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = await newGame(page, '어설트E');
    await startAssault(page, 'assault-e', 60);
    expect((await page.evaluate(() => window.__ec!.hud())).mapId).toBe('coex-underground');
    expect((await page.evaluate(() => window.__ec!.audio())).ambient).toBe('dark');
    await clearUntilPhase(page, 1);
    expect(await page.evaluate(() => window.__ec!.assault()?.phaseKind)).toBe('destroy');
    expect(await page.evaluate(() => window.__ec!.assault()?.objectivesLeft)).toEqual(['vent_1', 'vent_2', 'vent_3']);
    await page.screenshot({ path: 'e2e/out/assault-e-vents.png' });
    await page.evaluate(() => window.__ec!.destroyObjectives());
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'advance');
    await page.evaluate(() => window.__ec!.teleport(40 * 32, 20 * 32));
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'clear');
    await clearUntilPhase(page, 4);
    await page.evaluate(() => window.__ec!.teleport(85 * 32, 20 * 32));
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'boss');
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'zombie_ceo'), null, { timeout: 15000 });
    await page.waitForFunction(() => window.__ec!.audio().bgm === 'boss', null, { timeout: 5000 }); // boss bar → boss mood
    await page.screenshot({ path: 'e2e/out/assault-e-boss.png' });
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
    expect(after.won).toBeGreaterThanOrEqual(before.won + 150_000);
    expect(await page.evaluate(() => window.__ec!.state.stats.assaultClears['assault-e'])).toBe(1);
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone', null, { timeout: 20000 });
    expect((await page.evaluate(() => window.__ec!.hud())).mapId).toBe('gangnam-shelter'); // returns to the 2006 hub
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('F: clear the approach, hold the 광화문 booth through three waves, then drop the 사령관', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = await newGame(page, '어설트F');
    await startAssault(page, 'assault-f', 85);
    expect((await page.evaluate(() => window.__ec!.hud())).mapId).toBe('gwanghwamun-defense');
    await clearUntilPhase(page, 1);
    expect(await page.evaluate(() => window.__ec!.assault()?.phaseKind)).toBe('moveTo');
    await page.evaluate(() => window.__ec!.teleport(40 * 32, 22 * 32));
    await page.waitForFunction(() => window.__ec!.assault()?.phaseKind === 'defend');
    expect(await page.evaluate(() => window.__ec!.assault()?.boothHp)).toBe(6_000);
    await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
    await page.screenshot({ path: 'e2e/out/assault-f-defend.png' });
    // the boss spawns the same tick the phase flips — check the phase before wiping, or we kill him blind
    await page.waitForFunction(
      () => {
        if (window.__ec!.assault()?.phaseKind === 'boss') return true;
        window.__ec!.killAll();
        return false;
      },
      null,
      { timeout: 90000, polling: 250 },
    );
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'wito_commander'), null, { timeout: 15000 });
    await page.screenshot({ path: 'e2e/out/assault-f-boss.png' });
    await page.waitForFunction(
      () => {
        window.__ec!.killAll();
        return window.__ec!.assault()?.status === 'success';
      },
      null,
      { timeout: 30000, polling: 250 },
    );
    expect(await page.evaluate(() => window.__ec!.state.stats.assaultClears['assault-f'])).toBe(1);
    await page.waitForFunction(() => window.__ec!.scene() === 'SafeZone', null, { timeout: 20000 });
    expect((await page.evaluate(() => window.__ec!.hud())).mapId).toBe('seoul-station-shelter');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
