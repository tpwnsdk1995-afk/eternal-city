import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

test.describe('캠페인 · 메인스트림 · 업적', () => {
  test('kills feed stats and achievements, Q1 unlocks campaign chapter 1, dailies lock for the day, and it all survives a reload', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await newGame(page);
    await warpToField(page);
    await page.evaluate(() => window.__ec!.god(true));

    // take Q1 and the daily, then farm kills through the debug spawner
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('q_junggok_cleanup').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('ms_2002_normal').ok)).toBe(true);
    for (let round = 0; round < 5; round++) {
      await page.evaluate(() => {
        for (let i = 0; i < 5; i++) window.__ec!.spawn('zombie_casual_f', 120 + i * 20, (i - 2) * 30);
        window.__ec!.spawn('wito_recon', 200, 0);
      });
      await page.waitForTimeout(120);
      await page.evaluate(() => window.__ec!.killAll());
    }
    await page.waitForFunction(() => window.__ec!.state.stats.kills >= 30);
    const stats = await page.evaluate(() => window.__ec!.state.stats);
    expect(stats.killsByFaction.zombie).toBeGreaterThanOrEqual(25);
    expect(stats.killsByFaction.WITO).toBeGreaterThanOrEqual(5);
    expect(await page.evaluate(() => window.__ec!.state.achievements.unlocked)).toContain('ach_first_blood');

    // Q1 → campaign chapter 1 ready → claim
    expect(await page.evaluate(() => window.__ec!.actions.claimCampaign('2002', 'ch1').ok)).toBe(false); // Q1 not turned in yet
    expect(await page.evaluate(() => window.__ec!.actions.completeQuest('q_junggok_cleanup').ok)).toBe(true);
    const won0 = await page.evaluate(() => window.__ec!.hud().won);
    expect(await page.evaluate(() => window.__ec!.actions.claimCampaign('2002', 'ch1').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.hud().won)).toBe(won0 + 2000);
    expect(await page.evaluate(() => window.__ec!.state.flags['campaign:2002:ch1'])).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.claimCampaign('2002', 'ch1').ok)).toBe(false); // already claimed
    expect(await page.evaluate(() => window.__ec!.actions.claimCampaign('2002', 'ch2').ok)).toBe(false); // in progress

    // daily: complete once, then it refuses until tomorrow
    expect(await page.evaluate(() => window.__ec!.actions.completeQuest('ms_2002_normal').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('ms_2002_normal').ok)).toBe(false);
    expect(await page.evaluate(() => typeof window.__ec!.state.flags['daily:ms_2002_normal'])).toBe('number');
    expect(await page.evaluate(() => window.__ec!.state.stats.questsCompleted)).toBe(2);

    await page.evaluate(() => window.__ec!.questTab('campaign'));
    await page.waitForFunction(() => window.__ec!.windows().includes('quest'));
    await page.screenshot({ path: 'e2e/out/campaign.png' });
    await page.evaluate(() => window.__ec!.questTab('achievements'));
    await page.screenshot({ path: 'e2e/out/achievements.png' });

    // persistence
    await page.evaluate(() => window.__ec!.save());
    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500);
    await page.keyboard.press('c');
    await page.waitForFunction(() => ['SafeZone', 'Field'].includes(window.__ec?.scene() ?? ''));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__ec!.state.stats.kills)).toBe(stats.kills);
    expect(await page.evaluate(() => window.__ec!.state.achievements.unlocked)).toContain('ach_first_blood');
    expect(await page.evaluate(() => window.__ec!.state.flags['campaign:2002:ch1'])).toBe(true);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
