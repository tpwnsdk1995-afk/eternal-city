import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

/** 알파 훈련장: opt-in from character creation (T), trainer quest, dogs in the yard, ramp down to the parking hub. */
test.describe('알파 훈련장 (tutorial)', () => {
  test('T toggles the training start; the trainer quest completes on three dogs; the ramp leads to the hub', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '신입');
    await page.keyboard.press('t'); // typed into the focused name box — must NOT toggle the training start
    expect(await page.evaluate(() => (document.getElementById('ec-name') as HTMLInputElement).value)).toBe('신입t');
    await page.fill('#ec-name', '신입');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForTimeout(150);
    await page.keyboard.press('t'); // 훈련장부터 시작 (Phaser handles the key on its next step)
    await page.waitForFunction(() => {
      const sc = window.__ec!.game.scene.getScene('CharacterCreate') as unknown as { trainingBtn?: { text: string } };
      return sc.trainingBtn?.text.startsWith('☑') ?? false;
    });
    await page.screenshot({ path: 'e2e/out/charcreate-training.png' });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');
    await page.waitForFunction(() => window.__ec!.hud().mapId === 'alpha-training');
    expect(await page.evaluate(() => window.__ec!.state.character.name)).toBe('신입');
    await page.evaluate(() => window.__ec!.god(true));

    // trainer offers the tutorial quest
    await page.evaluate(() => window.__ec!.state.events.emit('npcInteract', { npcId: 'npc_trainer' }));
    await page.waitForFunction(() => window.__ec!.windows().includes('dialog'));
    expect(await page.evaluate(() => window.__ec!.buttonPos('dialog', '수락: 알파 훈련장'))).not.toBeNull();
    await page.evaluate(() => window.__ec!.closeWindows());
    expect(await page.evaluate(() => window.__ec!.actions.acceptQuest('q_tutorial').ok)).toBe(true);

    // only dogs spawn here; wipe three of them
    await page.waitForFunction(() => window.__ec!.enemies().length > 0, null, { timeout: 15000 });
    expect(await page.evaluate(() => window.__ec!.enemies().every((e) => e.id === 'zombie_dog'))).toBe(true);
    await page.screenshot({ path: 'e2e/out/training-yard.png' });
    await page.waitForFunction(
      () => {
        window.__ec!.killAll();
        const q = window.__ec!.state.quests.active.find((a) => a.id === 'q_tutorial');
        return !!q && (q.progress[0] ?? 0) >= 3;
      },
      null,
      { timeout: 30000, polling: 300 },
    );
    const won0 = await page.evaluate(() => window.__ec!.hud().won);
    expect(await page.evaluate(() => window.__ec!.actions.completeQuest('q_tutorial').ok)).toBe(true);
    expect(await page.evaluate(() => window.__ec!.hud().won)).toBe(won0 + 1_000);
    expect(await page.evaluate(() => window.__ec!.state.quests.completed)).toContain('q_tutorial');

    // ramp → 광진구청 지하주차장
    await page.evaluate(() => window.__ec!.warp('gwangjin-gucheong-parking', 'default'));
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('without the toggle a new character still starts in the parking hub', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '기본');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    expect(await page.evaluate(() => window.__ec!.hud().mapId)).toBe('gwangjin-gucheong-parking');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
