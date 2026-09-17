import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

/** Page-side deterministic RNG: `chance` always true/false, `range` picks the low end. */
const WIN = `({ chance: () => true, range: (lo) => lo, int: (lo) => lo, pick: (xs) => xs[0], next: () => 0 })`;
const LOSE = `({ chance: () => false, range: (lo) => lo, int: (lo) => lo, pick: (xs) => xs[0], next: () => 0.99 })`;

test.describe('기술상 (tuning)', () => {
  test('강화 succeeds/fails per the roll, parts install once, unique lands at +7, plus-up raises defense', async ({ page }) => {
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 20, won: 5_000_000 }));
    expect(await page.evaluate(() => window.__ec!.actions.buy('m16a2').ok)).toBe(true);
    const uid = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'm16a2')!.uid);
    await page.evaluate((u) => window.__ec!.actions.equipToggle(u), uid);
    const won0 = await page.evaluate(() => window.__ec!.state.character.won);

    // three wins → +3, one loss → +2
    for (let i = 0; i < 3; i++) expect(await page.evaluate(`window.__ec.actions.enhance(${JSON.stringify(uid)}, ${WIN}).ok`)).toBe(true);
    let stack = await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!, uid);
    expect(stack.enhance).toBe(3);
    expect(await page.evaluate(`window.__ec.actions.enhance(${JSON.stringify(uid)}, ${LOSE}).ok`)).toBe(false);
    stack = await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!, uid);
    expect(stack.enhance).toBe(2);
    expect(await page.evaluate(() => window.__ec!.state.character.won)).toBeLessThan(won0);
    expect((await page.evaluate(() => window.__ec!.hud())).weaponLabel).toBe('M16A2 +2');

    // parts: barrel once, second time refused; scope allowed on a rifle
    expect(await page.evaluate((u) => window.__ec!.actions.installPart(u, 'barrel').ok, uid)).toBe(true);
    expect(await page.evaluate((u) => window.__ec!.actions.installPart(u, 'barrel').ok, uid)).toBe(false);
    expect(await page.evaluate((u) => window.__ec!.actions.installPart(u, 'scope').ok, uid)).toBe(true);
    stack = await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!, uid);
    expect(stack.parts).toEqual(['barrel', 'scope']);

    // unique needs +7
    expect(await page.evaluate(`window.__ec.actions.uniqueTune(${JSON.stringify(uid)}, ${WIN}).ok`)).toBe(false);
    for (let i = 0; i < 5; i++) await page.evaluate(`window.__ec.actions.enhance(${JSON.stringify(uid)}, ${WIN})`);
    expect(await page.evaluate(`window.__ec.actions.uniqueTune(${JSON.stringify(uid)}, ${LOSE}).ok`)).toBe(false);
    expect(await page.evaluate(`window.__ec.actions.uniqueTune(${JSON.stringify(uid)}, ${WIN}).ok`)).toBe(true);
    stack = await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!, uid);
    expect(stack.enhance).toBe(7);
    expect(stack.unique).toBe('precision');
    expect((await page.evaluate(() => window.__ec!.hud())).weaponLabel).toBe('M16A2 +7 [정밀]');

    // plus-up on a bought top
    expect(await page.evaluate(() => window.__ec!.actions.buy('armor_top_basic').ok)).toBe(true);
    const top = await page.evaluate(() => window.__ec!.state.inventory.items.find((s) => s.itemId === 'armor_top_basic')!.uid);
    for (let i = 0; i < 5; i++) expect(await page.evaluate((u) => window.__ec!.actions.plusUp(u).ok, top)).toBe(true);
    expect(await page.evaluate((u) => window.__ec!.actions.plusUp(u).ok, top)).toBe(false);
    expect(await page.evaluate((u) => window.__ec!.state.inventory.items.find((s) => s.uid === u)!.plusUp, top)).toBe(5);

    // the tech NPC opens the tuning window; a save round-trips the tune state
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_tech' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    await page.evaluate(() => window.__ec!.openWindow('tuning'));
    await page.waitForFunction(() => window.__ec!.windows().includes('tuning'));
    await page.screenshot({ path: 'e2e/out/tuning.png' });
    await page.evaluate(() => window.__ec!.save());
    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500); // title fetches the save row
    await page.keyboard.press('c'); // 계속하기
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => window.__ec!.hud())).weaponLabel).toBe('M16A2 +7 [정밀]');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
