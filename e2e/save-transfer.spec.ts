import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { clickAt, newGame, watchErrors } from './helpers';

/** 세이브 내보내기/불러오기 — moving a character between devices as a .json file. */
test.describe('save transfer', () => {
  test('exported text re-imports on a fresh browser profile and continues from the title', async ({ page, context }) => {
    const errors = await newGame(page, '이동자');
    await page.evaluate(() => {
      window.__ec!.actions.allocate('기술', 4);
      window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 123_456, level: 7 });
      window.__ec!.state.setFlag('parallelPermit', true);
    });
    await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromParking'));
    await page.waitForFunction(() => window.__ec?.scene() === 'Field');

    // 내보내기 (파일): the Esc menu button triggers a download
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ec!.windows().includes('menu'));
    await page.screenshot({ path: 'e2e/out/menu-transfer.png' });
    const exportBtn = (await page.evaluate(() => window.__ec!.buttonPos('menu', '내보내기 (파일)')))!;
    expect(exportBtn).not.toBeNull();
    const [download] = await Promise.all([page.waitForEvent('download'), clickAt(page, exportBtn)]);
    // headless Chromium reports blob downloads as "download"; a real browser uses the a[download] name
    expect(download.suggestedFilename()).toMatch(/^(eternal-city_이동자_Lv7_\d{8}-\d{4}\.json|download)$/);
    const downloaded = fs.readFileSync((await download.path())!, 'utf-8');
    expect(JSON.parse(downloaded).app).toBe('eternal-city');
    expect(JSON.parse(downloaded).save.character.name).toBe('이동자');
    const text = (await page.evaluate(() => window.__ec!.exportSave()))!;
    expect(JSON.parse(text).app).toBe('eternal-city');

    // a second, clean browser context = another device with no IndexedDB
    const other = await context.browser()!.newContext({ viewport: { width: 1280, height: 720 } });
    const p2 = await other.newPage();
    const errors2 = watchErrors(p2);
    await p2.goto('/');
    await p2.waitForFunction(() => window.__ec?.scene() === 'Title');
    await p2.waitForTimeout(400);
    expect(await p2.evaluate(() => window.__ec!.hasSave())).toBe(false);

    // 타이틀 → 세이브 파일 불러오기… → picker → continues into the imported character
    const [chooser] = await Promise.all([p2.waitForEvent('filechooser'), clickAt(p2, { x: 640, y: 360 - 40 + 252 })]); // '세이브 파일 불러오기…' under the slot cards
    await chooser.setFiles({ name: 'eternal-city_이동자.json', mimeType: 'application/json', buffer: Buffer.from(text, 'utf-8') });
    await p2.waitForFunction(() => window.__ec?.scene() === 'Field', undefined, { timeout: 15000 });
    const hud = await p2.evaluate(() => window.__ec!.hud());
    expect(hud.mapId).toBe('junggok-dong');
    expect(hud.won).toBe(123_456);
    expect(hud.level).toBe(7);
    expect(await p2.evaluate(() => window.__ec!.state.character.name)).toBe('이동자');
    expect(await p2.evaluate(() => window.__ec!.state.character.base['기술'])).toBe(4);
    expect(await p2.evaluate(() => window.__ec!.state.flags.parallelPermit)).toBe(true);
    expect(await p2.evaluate(() => window.__ec!.hasSave())).toBe(true);
    await p2.screenshot({ path: 'e2e/out/import-continued.png' });

    // damaged / foreign files are refused with a reason and nothing changes
    const bad = await p2.evaluate((t) => window.__ec!.importSave(t.slice(0, t.length - 40)), text);
    expect(bad.ok).toBe(false);
    expect(await p2.evaluate(() => window.__ec!.importSave('{"hello":1}'))).toEqual({ ok: false, reason: 'format' });
    expect(await p2.evaluate(() => window.__ec!.importSave('garbage'))).toEqual({ ok: false, reason: 'parse' });

    expect(errors, errors.join('\n')).toEqual([]);
    expect(errors2, errors2.join('\n')).toEqual([]);
    await other.close();
  });

  test('in-game import swaps the live character and travels to its saved map', async ({ page }) => {
    const errors = await newGame(page, '원래캐릭');
    // craft a foreign save: a different character parked in 중곡동
    const text = await page.evaluate(async () => {
      const s = window.__ec!.state;
      const keep = { character: s.character, map: s.currentMapId };
      s.setCharacter({ ...s.character, name: '외부캐릭', level: 9, won: 4_321 });
      s.currentMapId = 'junggok-dong';
      const t = await window.__ec!.exportSave();
      s.setCharacter(keep.character);
      s.currentMapId = keep.map;
      return t!;
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ec!.windows().includes('menu'));
    const importBtn = (await page.evaluate(() => window.__ec!.buttonPos('menu', '불러오기 (파일)')))!;
    expect(importBtn).not.toBeNull();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), clickAt(page, importBtn)]);
    await chooser.setFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(text, 'utf-8') });
    await page.waitForFunction(() => window.__ec?.scene() === 'Field' && window.__ec!.state.character.name === '외부캐릭', undefined, { timeout: 15000 });
    const hud = await page.evaluate(() => window.__ec!.hud());
    expect(hud.mapId).toBe('junggok-dong');
    expect(hud.won).toBe(4_321);
    expect(hud.level).toBe(9);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
