import { expect, test, type Page } from '@playwright/test';
import { watchErrors } from './helpers';

/** 세이브 슬롯 3개: 숫자키 선택 → Enter 새 게임/계속하기, Delete 두 번 삭제, 슬롯별 독립 저장. */
async function createIn(page: Page, slotKey: string, name: string): Promise<void> {
  await page.waitForFunction(() => window.__ec?.scene() === 'Title');
  await page.waitForTimeout(400);
  await page.keyboard.press(slotKey);
  await page.waitForTimeout(120);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'CharacterCreate');
  await page.fill('#ec-name', name);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
  await page.waitForTimeout(300);
}

test.describe('save slots', () => {
  test('two characters live in two slots; Enter continues the selected one; Delete needs a confirm', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await page.goto('/');
    await createIn(page, '1', '첫째');
    expect(await page.evaluate(() => window.__ec!.currentSlot())).toBe(1);
    await page.evaluate(() => window.__ec!.state.setCharacter({ ...window.__ec!.state.character, won: 111_111 }));
    await page.evaluate(() => window.__ec!.save());

    await page.evaluate(() => window.__ec!.state.events.emit('goTitle', undefined));
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForFunction(() => window.__ec!.slots().then((s) => s[0]?.name === '첫째'), null, { timeout: 5000 });
    await page.screenshot({ path: 'e2e/out/title-slots-1.png' });
    let slots = await page.evaluate(() => window.__ec!.slots());
    expect(slots[0]?.name).toBe('첫째');
    expect(slots[1]).toBeNull();

    // second character in slot 2
    await createIn(page, '2', '둘째');
    expect(await page.evaluate(() => window.__ec!.currentSlot())).toBe(2);
    expect(await page.evaluate(() => window.__ec!.hud().won)).toBe(50_000); // fresh kit, not 첫째's money
    await page.evaluate(() => window.__ec!.save());
    await page.evaluate(() => window.__ec!.state.events.emit('goTitle', undefined));
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForFunction(() => window.__ec!.slots().then((s) => s[0]?.name === '첫째' && s[1]?.name === '둘째' && s[2] === null), null, { timeout: 5000 });
    slots = await page.evaluate(() => window.__ec!.slots());
    expect(slots.map((s) => s?.name)).toEqual(['첫째', '둘째', undefined]);
    await page.screenshot({ path: 'e2e/out/title-slots-2.png' });

    // select slot 1 and continue → 첫째 with the saved money
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ec?.scene() === 'SafeZone');
    expect(await page.evaluate(() => window.__ec!.state.character.name)).toBe('첫째');
    expect(await page.evaluate(() => window.__ec!.hud().won)).toBe(111_111);
    expect(await page.evaluate(() => window.__ec!.currentSlot())).toBe(1);

    // back to title: Delete on slot 2 asks first, second press deletes
    await page.evaluate(() => window.__ec!.state.events.emit('goTitle', undefined));
    await page.waitForFunction(() => window.__ec?.scene() === 'Title');
    await page.waitForTimeout(400);
    await page.keyboard.press('2');
    await page.waitForTimeout(120);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.__ec!.slots()))[1]?.name).toBe('둘째'); // still there after one press
    await page.keyboard.press('Delete');
    await page.waitForFunction(() => window.__ec!.slots().then((s) => s[1] === null), null, { timeout: 5000 });
    expect((await page.evaluate(() => window.__ec!.slots()))[0]?.name).toBe('첫째');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
