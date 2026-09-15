import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

const WIN = `({ chance: () => true, range: (lo) => lo, int: (lo) => lo, pick: (xs) => xs[0], next: () => 0 })`;
const LOSE = `({ chance: () => false, range: (lo) => lo, int: (lo) => lo, pick: (xs) => xs[0], next: () => 0.99 })`;

test.describe('길드 · 방어구 조합', () => {
  test('founding a guild, contributing to level it, perks apply, and it survives a reload', async ({ page }) => {
    const errors = await newGame(page, '길드장');
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 3_000_000 }));
    const hp0 = (await page.evaluate(() => window.__ec!.hud())).hpMax;
    const w0 = await page.evaluate(() => window.__ec!.state.derived().maxWeightKg);

    // dialog with 구청 과장 offers the guild office
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_mainstream' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    const pos = await page.evaluate(() => window.__ec!.buttonPos('dialog', '길드 사무실'));
    expect(pos).not.toBeNull();
    await page.evaluate(() => window.__ec!.closeWindows());

    expect(await page.evaluate(() => window.__ec!.actions.foundGuild('x').ok)).toBe(false);
    expect(await page.evaluate(() => window.__ec!.actions.foundGuild('중곡동 헌터즈').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.guild.name)).toBe('중곡동 헌터즈');
    expect(await page.evaluate(() => window.__ec!.state.character.won)).toBe(3_000_000 - 50_000);
    // Lv.1 perks: +1% HP, +2kg
    expect((await page.evaluate(() => window.__ec!.hud())).hpMax).toBeGreaterThanOrEqual(hp0);
    expect(await page.evaluate(() => window.__ec!.state.derived().maxWeightKg)).toBeCloseTo(w0 + 2, 5);
    expect(await page.evaluate(() => window.__ec!.state.xpMult())).toBeCloseTo(1.02, 5);

    await page.evaluate(() => window.__ec!.openWindow('guild'));
    await page.waitForFunction(() => window.__ec!.windows().includes('guild'));
    await page.screenshot({ path: 'e2e/out/guild.png' });

    expect(await page.evaluate(() => window.__ec!.actions.donateGuild(500_000).ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.guild.contributed)).toBe(500_000);
    expect(await page.evaluate(() => window.__ec!.state.xpMult())).toBeCloseTo(1.06, 5); // Lv.3
    expect(await page.evaluate(() => window.__ec!.state.derived().maxWeightKg)).toBeCloseTo(w0 + 6, 5);
    expect(await page.evaluate(() => window.__ec!.actions.donateGuild(999_999_999).ok)).toBe(false);

    await page.evaluate(() => window.__ec!.save());
    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500);
    await page.keyboard.press('c');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    expect(await page.evaluate(() => window.__ec!.state.guild)).toMatchObject({ name: '중곡동 헌터즈', contributed: 500_000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('방어구 조합 consumes the material, promotes the prefix on a win, keeps the better plus-up on a loss', async ({ page }) => {
    const errors = await newGame(page, '조합사');
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 20, won: 5_000_000 }));
    await page.evaluate(() => {
      window.__ec!.give('armor_top_tactical', 1);
      window.__ec!.give('armor_top_tactical', 1);
      window.__ec!.give('armor_top_tactical', 1);
    });
    const uids = await page.evaluate(() => window.__ec!.state.inventory.items.filter((s) => s.itemId === 'armor_top_tactical').map((s) => s.uid));
    expect(uids.length).toBe(3);
    // plus-up the material twice so the survivor inherits +2 on the failed roll
    await page.evaluate((u) => {
      window.__ec!.actions.plusUp(u);
      window.__ec!.actions.plusUp(u);
    }, uids[1]);
    const won0 = await page.evaluate(() => window.__ec!.state.character.won);

    expect(await page.evaluate(`window.__ec.actions.combineArmor(${JSON.stringify(uids[0])}, ${JSON.stringify(uids[1])}, ${LOSE}).ok`)).toBe(false);
    let a = await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!, uids[0]);
    expect(a.prefix).toBeUndefined();
    expect(a.plusUp).toBe(2);
    expect(await page.evaluate((u) => window.__ec!.state.inventory.items.some((s) => s.uid === u), uids[1])).toBe(false); // material gone
    expect(await page.evaluate(() => window.__ec!.state.character.won)).toBeLessThan(won0);

    expect(await page.evaluate(`window.__ec.actions.combineArmor(${JSON.stringify(uids[0])}, ${JSON.stringify(uids[2])}, ${WIN}).ok`)).toBe(true);
    a = await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!, uids[0]);
    expect(a.prefix).toBe('고대');
    expect(await page.evaluate(() => window.__ec!.state.inventory.items.filter((s) => s.itemId === 'armor_top_tactical').length)).toBe(1);
    // no material left → mismatch/none; same-uid refused
    expect(await page.evaluate((u) => window.__ec!.actions.combineArmor(u, u).ok, uids[0])).toBe(false);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
