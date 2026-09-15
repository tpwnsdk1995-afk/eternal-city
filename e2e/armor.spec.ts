import { expect, test } from '@playwright/test';
import { newGame } from './helpers';

test.describe('방어구 전 부위 + 스킬 확장', () => {
  test('wearing all six slots raises defense; status window shows the gear; active skill drains AP', async ({ page }) => {
    const errors = await newGame(page);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, level: 25, won: 3_000_000, base: { ...window.__ec!.state.character.base, 지능: 30 } }));
    const def0 = await page.evaluate(() => window.__ec!.state.defense());

    const ids = ['armor_top_tactical_cl', 'armor_bottom_tactical', 'armor_coat_kevlar', 'armor_shoes_tactical', 'armor_hat_tactical', 'armor_wig_long'];
    for (const id of ids) {
      expect(await page.evaluate((i) => window.__ec!.actions.buy(i).ok, id), id).toBe(true);
      const uid = await page.evaluate((i) => window.__ec!.state.inventory.items.find((s) => s.itemId === i)!.uid, id);
      expect(await page.evaluate((u) => window.__ec!.actions.equipToggle(u).ok, uid), id).toBe(true);
    }
    const worn = await page.evaluate(() => Object.keys(window.__ec!.state.equipment.armor).sort());
    expect(worn).toEqual(['가발', '모자', '상의', '신발', '코트', '하의']);
    const def1 = await page.evaluate(() => window.__ec!.state.defense());
    expect(def1).toBeGreaterThan(def0 + 80); // CL top 39 + coat 22 + pants 16 + boots 11 + helmet 13 + wig 3

    // skills: learn + activate 돌격소총 마스터리 and 전투 자극 (AP drain)
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_elia' }));
    expect(await page.evaluate(() => window.__ec!.actions.learnSkill('skill_rifle_mastery').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.learnSkill('skill_combat_stim').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.toggleSkill('skill_rifle_mastery').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.toggleSkill('skill_combat_stim').ok)).toBe(true);
    const ap0 = await page.evaluate(() => window.__ec!.hud().ap);
    // the safe zone has no combat bridge, so drain only runs in a combat map
    await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromParking'));
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');
    await page.waitForTimeout(1500);
    const ap1 = await page.evaluate(() => window.__ec!.hud().ap);
    expect(ap1).toBeLessThan(ap0); // 3/s drain beats 2/s regen
    expect(await page.evaluate(() => window.__ec!.state.skills.active['퍼스널액티브'])).toBe('skill_combat_stim');

    await page.evaluate(() => window.__ec!.openWindow('status'));
    await page.evaluate(() => window.__ec!.openWindow('skills'));
    await page.waitForFunction(() => window.__ec!.windows().includes('skills'));
    await page.screenshot({ path: 'e2e/out/armor-skills.png' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
