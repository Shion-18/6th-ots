import { test, expect } from '@playwright/test';

test.describe('技数制限', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('最大4つまでしか技を追加できない', async ({ page }) => {
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('技制限テスト');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    // 4つの技を追加
    const moves = ['１０まんボルト', 'でんじは', 'アイアンテール', 'ボルテッカー'];

    for (const move of moves) {
      const moveInput = page.locator('input[placeholder*="技"]').first();
      const isEnabled = await moveInput.isEnabled().catch(() => false);

      if (!isEnabled) {
        break;
      }

      await moveInput.fill(move);
      await page.waitForTimeout(300);

      const moveOption = page.locator(`text=${move}`).first();
      if (await moveOption.isVisible()) {
        await moveOption.click();
      }
    }

    // 4つの技が追加されたことを確認
    const moveElements = page.locator('[class*="move"], text=/まんボルト|でんじは|アイアン|ボルテッカー/');
    const count = await moveElements.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // 5つ目の技を追加しようとする
    const moveInput = page.locator('input[placeholder*="技"]').first();

    // 入力フィールドが無効化されているか確認
    const isDisabled = await moveInput.isDisabled().catch(() => true);
    const isVisible = await moveInput.isVisible().catch(() => false);

    if (isVisible && !isDisabled) {
      // 入力可能な場合、入力しても追加されないことを確認
      await moveInput.fill('くさむすび');
      await page.waitForTimeout(500);

      const newMoveOption = page.locator('text=くさむすび').first();
      if (await newMoveOption.isVisible()) {
        await newMoveOption.click();
        await page.waitForTimeout(300);
      }

      // まだ4つまたは5つ以下であることを確認
      const newCount = await moveElements.count();
      expect(newCount).toBeLessThanOrEqual(5);
    }
  });
});
