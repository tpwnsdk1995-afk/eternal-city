import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

/**
 * Account-bound cloud save. The real store is the claude.ai play page's `db` capability; here a
 * fake `window.claude.use('db')` backed by localStorage stands in, so we can wipe the browser's
 * IndexedDB (a "new device") and watch the title screen pull the save back down.
 */
const FAKE_CLAUDE = `
  (() => {
    const KEY = 'fake-cloud-db';
    const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
    const store = {
      doc(path) {
        return {
          async get() { const d = load()[path]; return { exists: !!d, data: () => d }; },
          async set(data) { const all = load(); all[path] = data; localStorage.setItem(KEY, JSON.stringify(all)); window.__cloudWrites = (window.__cloudWrites || 0) + 1; },
        };
      },
    };
    window.claude = { use: async (name) => (name === 'db' ? store : null) };
  })();
`;

test.describe('cloud save', () => {
  test('saves are pushed to the account store and restored on a wiped browser', async ({ page, context }) => {
    await page.addInitScript(FAKE_CLAUDE);
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
    await page.fill('#ec-name', '클라우드맨');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 55_555, level: 6 }));
    await page.evaluate(() => window.__ec!.save());
    await page.waitForFunction(() => window.__ec!.cloud().state === 'synced', undefined, { timeout: 5000 });
    const writes = await page.evaluate(() => (window as unknown as { __cloudWrites: number }).__cloudWrites);
    expect(writes).toBeGreaterThan(0);
    const cloudDoc = await page.evaluate(() => JSON.parse(localStorage.getItem('fake-cloud-db')!)['saves/slot1']);
    expect(cloudDoc.character.name).toBe('클라우드맨');
    expect(cloudDoc.character.won).toBe(55_555);

    // "another device": same account (the fake store's contents are carried over), empty browser
    const cloudJson = await page.evaluate(() => localStorage.getItem('fake-cloud-db')!);
    const other = await context.browser()!.newContext({ viewport: { width: 1280, height: 720 } });
    const p2 = await other.newPage();
    await p2.addInitScript(FAKE_CLAUDE);
    await p2.addInitScript((json) => localStorage.setItem('fake-cloud-db', json), cloudJson);
    const errors2 = watchErrors(p2);
    await p2.goto('/');
    await p2.waitForFunction(() => window.__ec?.scene() === 'Title');
    await p2.waitForFunction(() => window.__ec!.cloud().state === 'pulled', undefined, { timeout: 15000 });
    expect(await p2.evaluate(() => window.__ec!.hasSave())).toBe(true);
    await p2.screenshot({ path: 'e2e/out/cloud-title.png' });
    await p2.keyboard.press('c');
    await p2.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    const hud = await p2.evaluate(() => window.__ec!.hud());
    expect(hud.won).toBe(55_555);
    expect(hud.level).toBe(6);
    expect(await p2.evaluate(() => window.__ec!.state.character.name)).toBe('클라우드맨');
    expect(errors2, errors2.join('\n')).toEqual([]);
    await other.close();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('without a host store the status reads offline and local saves still work', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForFunction(() => window.__ec!.cloud().state === 'offline', undefined, { timeout: 5000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
