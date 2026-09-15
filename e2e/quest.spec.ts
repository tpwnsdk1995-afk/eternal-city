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

  test('Q2: reach 용곡중학교, recover the WITO dispatch document, earn the 패러렐 허가증', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = await newGame(page);
    await warpToField(page);
    await page.evaluate(() => {
      window.__ec!.god(true);
      // finish Q1 quickly: accept, then debug-complete via kills
      window.__ec!.actions.acceptQuest('q_junggok_cleanup');
    });
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 90, 0));
      await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'zombie_casual_f'));
      await page.evaluate(() => window.__ec!.killAll());
    }
    await page.waitForFunction(() => window.__ec!.state.quests.active[0]?.progress[0] === 10);
    await page.evaluate(() => window.__ec!.actions.completeQuest('q_junggok_cleanup'));
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 5 }));
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('q_wito_documents').ok)).toBe(true);
    expect(await page.evaluate(() => !!window.__ec!.state.flags.parallelPermit)).toBe(false);

    // walk north through the portal into the school
    await page.evaluate(() => window.__ec!.warp('yonggok-middle-school', 'fromJunggok'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'yonggok-middle-school');
    await page.waitForTimeout(600);
    await page.waitForFunction(() => window.__ec!.state.quests.active[0]?.progress[0] === 1); // reach step
    // WITO soldiers spawn on the field
    await page.waitForFunction(() => window.__ec!.enemies().some((e) => e.id === 'wito_soldier'), null, { timeout: 15000 });
    await page.evaluate(() => window.__ec!.teleport(35 * 32, 31 * 32));
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/out/school.png' });
    // the document drop is a 35% roll — hand it over directly to keep the test deterministic
    await page.evaluate(() => window.__ec!.give('wito_dispatch_doc', 1));
    await page.waitForFunction(() => window.__ec!.state.quests.active[0]?.progress[1] === 1);

    await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromSchool'));
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'junggok-dong');
    expect(await page.evaluate(() => window.__ec!.actions.completeQuest('q_wito_documents').ok)).toBe(true);
    expect(await page.evaluate(() => !!window.__ec!.state.flags.parallelPermit)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.state.inventory.items.some((s) => s.itemId === 'wito_dispatch_doc'))).toBe(false);
    expect(await page.evaluate(() => window.__ec!.state.quests.completed)).toEqual(['q_junggok_cleanup', 'q_wito_documents']);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
