import type { Page } from '@playwright/test';
import type {} from '../src/debug/exposeDebug';

/** Collects page errors so specs can assert on a clean console. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

/** Boot → Title → 새 게임 → 캐릭터 생성 → SafeZone. */
export async function newGame(page: Page, name = '테스터'): Promise<string[]> {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.waitForFunction(() => window.__ec?.scene() === 'Title');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
  await page.fill('#ec-name', name);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
  await page.waitForTimeout(300);
  return errors;
}

export async function warpToField(page: Page): Promise<void> {
  await page.evaluate(() => window.__ec!.warp('junggok-dong', 'fromParking'));
  await page.waitForFunction(() => window.__ec?.scene() === 'Field');
  await page.waitForTimeout(300);
}

/**
 * Click a canvas UI element. Phaser reads the pointer position from the last move, so a bare
 * `mouse.click` can land before the position is registered; move first, then press.
 */
export async function clickAt(page: Page, pos: { x: number; y: number } | null): Promise<void> {
  if (!pos) throw new Error('clickAt: no position');
  await page.mouse.move(pos.x, pos.y);
  await page.waitForTimeout(80);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.up();
}
