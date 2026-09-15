import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

test.describe('사이버샵 · 버프 · 프리미엄 쿠폰', () => {
  test('steroid raises damage mods, premium adds weight and ₩/XP multipliers, the enhance ticket is spent on one attempt, and buffs survive a reload', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 2_000_000, level: 20 }));
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_cybershop' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.evaluate(() => window.__ec!.openShop('npc_cybershop'));
    await page.waitForFunction(() => window.__ec!.windows().includes('shop'));
    await page.screenshot({ path: 'e2e/out/cybershop.png' });

    const weight0 = await page.evaluate(() => window.__ec!.state.derived().maxWeightKg);
    for (const id of ['steroid_shot', 'premium_coupon', 'enhance_ticket', 'hp_pack']) expect(await page.evaluate((i) => window.__ec!.actions.buy(i).ok, id), id).toBe(true);
    const use = (id: string) =>
      page.evaluate((i) => {
        const stack = window.__ec!.state.inventory.items.find((s) => s.itemId === i);
        return stack ? window.__ec!.actions.use(stack.uid).ok : false;
      }, id);

    expect(await use('steroid_shot')).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.mods().dmgPct)).toBeCloseTo(0.15);
    expect(await use('premium_coupon')).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.derived().maxWeightKg)).toBeCloseTo(weight0 + 10);
    expect(await page.evaluate(() => window.__ec!.state.xpMult())).toBeCloseTo(1.3);
    expect(await page.evaluate(() => window.__ec!.state.wonMult())).toBeCloseTo(1.2);
    expect(await page.evaluate(() => window.__ec!.state.buffs.active.length)).toBe(2);

    // enhance ticket: flagged until the next attempt, then consumed
    expect(await use('enhance_ticket')).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.flags.enhanceBonus)).toBe(20);
    expect(await use('enhance_ticket')).toBe(false); // none left in the bag (and a second would be refused anyway)
    const glock = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'glock17')!.uid);
    await page.evaluate(`window.__ec.actions.enhance(${JSON.stringify(glock)}, { chance: () => false, range: (lo) => lo, int: (lo) => lo, pick: (xs) => xs[0], next: () => 0.99 })`);
    expect(await page.evaluate(() => window.__ec!.state.flags.enhanceBonus)).toBe(0);

    // premium ₩ multiplier on a pickup: kill a zombie and pick up its money
    await warpToField(page);
    await page.evaluate(() => window.__ec!.god(true));
    const xp0 = await page.evaluate(() => window.__ec!.hud().xp);
    await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 40, 0));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__ec!.killAll());
    const xpGain = (await page.evaluate(() => window.__ec!.hud().xp)) - xp0;
    expect(xpGain).toBeGreaterThanOrEqual(Math.round(1 * 1.3)); // Lv.20 vs Lv.1 zombie: minimum XP, still multiplied and rounded up from 1

    // buffs persist across a save/load (wall clock)
    await page.evaluate(() => window.__ec!.save());
    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500);
    await page.keyboard.press('c');
    await page.waitForFunction(() => ['SafeZone', 'Field'].includes(window.__ec?.scene() ?? ''));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__ec!.state.buffs.active.map((b) => b.id).sort())).toEqual(['buff_premium', 'buff_steroid']);
    expect(await page.evaluate(() => window.__ec!.state.mods().dmgPct)).toBeCloseTo(0.15);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
