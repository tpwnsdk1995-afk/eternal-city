import { expect, test } from '@playwright/test';
import { newGame, warpToField } from './helpers';

/** Stress: 200 zombies alive around the player. Headless SwiftShader is far slower than a laptop GPU, so the bar is modest; the number is logged for the record. */
test.describe('performance', () => {
  test('200 spawned zombies keep the frame rate above the headless floor and cause no errors', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await newGame(page, '스트레스');
    await warpToField(page);
    await page.evaluate(() => window.__ec!.god(true));
    await page.evaluate(() => {
      for (let i = 0; i < 200; i++) {
        const a = (i / 200) * Math.PI * 2;
        const r = 160 + (i % 7) * 40;
        window.__ec!.spawn(i % 3 === 0 ? 'zombie_suit_m' : 'zombie_casual_f', Math.cos(a) * r, Math.sin(a) * r);
      }
    });
    await page.waitForFunction(() => window.__ec!.enemies().length >= 150, null, { timeout: 15000 });
    await page.waitForTimeout(1500); // let them all aggro and start moving
    const samples: number[] = [];
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(500);
      samples.push(await page.evaluate(() => window.__ec!.fps()));
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    console.log(`[perf] 200 zombies: avg ${avg.toFixed(1)} fps (samples ${samples.map((s) => s.toFixed(0)).join(' ')})`);
    await page.screenshot({ path: 'e2e/out/perf-200.png' });
    expect(avg).toBeGreaterThan(12); // regression floor for headless SwiftShader (a laptop GPU runs several times faster)
    expect(await page.evaluate(() => window.__ec!.enemies().length)).toBeGreaterThan(100);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
