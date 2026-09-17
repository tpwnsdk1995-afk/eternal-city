import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

/**
 * Procedural audio. Headless Chromium has no speakers, so the checks read the AudioManager's
 * play log (`__ec.audio().recent`) — every cue is recorded whether or not the context is unlocked.
 */
test.describe('audio', () => {
  test('ambient beds follow the scene; combat, UI and pickups log their cues; toggles persist', async ({ page }) => {
    const errors = await newGame(page, '사운드');
    let a = await page.evaluate(() => window.__ec!.audio());
    expect(a.ambient).toBe('safe');
    expect(a.bgm).toBe('safe');
    expect(a.recent).toContain('ambient:rain'); // title
    expect(a.recent).toContain('bgm:title');
    expect(a.unlocked).toBe(true); // Enter on the title counted as the unlocking gesture

    // window open/close
    await page.keyboard.press('i');
    await page.waitForFunction(() => window.__ec!.windows().includes('inventory'));
    await page.keyboard.press('i');
    await page.waitForFunction(() => !window.__ec!.windows().includes('inventory'));
    a = await page.evaluate(() => window.__ec!.audio());
    expect(a.recent).toContain('ui_open');
    expect(a.recent).toContain('ui_close');

    // field: wind bed, gunshot by class, flesh hit, enemy death, money pickup
    await warpToField(page);
    await page.evaluate(() => window.__ec!.god(true));
    a = await page.evaluate(() => window.__ec!.audio());
    expect(a.ambient).toBe('field');
    expect(a.bgm).toBe('field');
    const uid = await page.evaluate(() => window.__ec!.spawn('zombie_casual_f', 90, 0));
    const ammo0 = (await page.evaluate(() => window.__ec!.hud())).ammo;
    const scr = (await page.evaluate(() => window.__ec!.toScreen(window.__ec!.player()!.x + 90, window.__ec!.player()!.y)))!;
    await page.mouse.move(scr.x, scr.y);
    await page.mouse.down({ button: 'right' });
    await page.waitForFunction((n) => window.__ec!.hud().ammo < n, ammo0, { timeout: 5000 });
    await page.waitForFunction((u) => !window.__ec!.enemies().some((e) => e.uid === u), uid, { timeout: 15000 });
    await page.mouse.up({ button: 'right' });
    a = await page.evaluate(() => window.__ec!.audio());
    expect(a.recent).toContain('shot:권총');
    expect(a.recent).toContain('hit_flesh');
    expect(a.recent).toContain('enemy_die');

    // walk over the drops → pickup cues
    const drops = await page.evaluate(() => window.__ec!.state.worldProvider!().pickups);
    if (drops.length) {
      await page.evaluate((d) => window.__ec!.teleport(d.x, d.y), drops[0]);
      await page.waitForTimeout(400);
      a = await page.evaluate(() => window.__ec!.audio());
      expect(a.recent.some((n) => n === 'pickup_won' || n === 'pickup_item')).toBe(true);
    }

    // sound off: cues are still logged (for tests) but the setting flips and survives a save
    await page.evaluate(() => window.__ec!.state.setSettings({ sfxOn: false, soundVolume: 0.3, bgmOn: false, uiScale: 1.15 }));
    await page.evaluate(() => window.__ec!.save());
    await page.reload();
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.__ec!.state.settings.sfxOn)).toBe(false);
    expect(await page.evaluate(() => window.__ec!.state.settings.soundVolume)).toBe(0.3);
    expect(await page.evaluate(() => window.__ec!.state.settings.bgmOn)).toBe(false);
    expect(await page.evaluate(() => window.__ec!.state.settings.uiScale)).toBe(1.15);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a dark map (일산 지하수로) switches to the sewer bed and a launcher logs launch + explode', async ({ page }) => {
    const errors = await newGame(page, '폭발');
    await page.evaluate(() => {
      const c = window.__ec!.state.character;
      window.__ec!.state.setCharacter({ ...c, won: 999_999, level: 30, base: { ...c.base, 지능: 30 } }); // M79 needs 기술등급 2
      window.__ec!.state.setSettings({ controlScheme: 'modern' });
    });
    await page.evaluate(() => window.__ec!.warp('ilsan-waterway', 'default'));
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => window.__ec!.audio())).ambient).toBe('dark');
    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => {
      window.__ec!.actions.buy('m79');
      window.__ec!.actions.buy('ammo_grenade');
      const s = window.__ec!.state.inventory.items.find((x) => x.itemId === 'm79')!;
      window.__ec!.actions.equipToggle(s.uid);
    });
    expect((await page.evaluate(() => window.__ec!.hud())).weaponName).toBe('M79 유탄발사기');
    const p = (await page.evaluate(() => window.__ec!.player()))!;
    const scr = (await page.evaluate(([x, y]) => window.__ec!.toScreen(x, y), [p.x + 200, p.y] as const))!;
    await page.mouse.move(scr.x, scr.y);
    await page.mouse.down();
    await page.waitForFunction(() => window.__ec!.audio().recent.includes('shot:투척중화기'), undefined, { timeout: 5000 });
    await page.mouse.up();
    await page.waitForFunction(() => window.__ec!.audio().recent.includes('explode'), undefined, { timeout: 8000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
