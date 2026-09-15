import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

test.describe('quests', () => {
  test('김훈 소대장 Q1: accept, kill 10 zombies, turn in for rewards', async ({ page }) => {
    const errors = await newGame(page);
    await warpToField(page);
    await page.evaluate(() => window.__ec!.god(true));
    const won0 = await page.evaluate(() => window.__ec!.hud().won);

    // talking to the NPC offers the quest
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_kimhun' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('q_junggok_cleanup').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.quests.active.map((q) => q.id))).toEqual(['q_junggok_cleanup']);
    // cannot turn in yet
    expect(await page.evaluate(() => window.__ec!.actions.completeQuest('q_junggok_cleanup').ok)).toBe(false);

    // Q window shows it
    await page.keyboard.press('q');
    await page.waitForFunction(() => window.__ec!.windows().includes('quest'));
    await page.screenshot({ path: 'e2e/out/quest.png' });
    await page.keyboard.press('q');

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 90, 0));
      await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'zombie_casual_f'));
      await page.evaluate(() => window.__ec!.killAll());
    }
    await page.waitForFunction(() => window.__ec!.state.quests.active[0]?.progress[0] === 10);
    expect(await page.evaluate(() => window.__ec!.actions.completeQuest('q_junggok_cleanup').ok)).toBe(true);
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.won).toBeGreaterThanOrEqual(won0 + 3000);
    expect(await page.evaluate(() => window.__ec!.state.quests.completed)).toEqual(['q_junggok_cleanup']);
    expect(hud.ammo).toBeGreaterThanOrEqual(200); // +100 9mm reward
    // Q2 is level-gated at 3
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('q_wito_documents').ok)).toBe(hud.level >= 3);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
