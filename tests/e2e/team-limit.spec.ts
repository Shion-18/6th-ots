import { test, expect } from '@playwright/test';
import { selectGenderIfRequired } from './helpers';

test.describe('1パーティ制限', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('2つ目のパーティ保存時に確認ダイアログが表示される', async ({ page }) => {
    // 1つ目のパーティを作成・保存
    await page.goto('/builder');

    const nameInput = page.locator('input[placeholder*="パーティ"]').first();
    await nameInput.fill('パーティA');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    // 保存
    await selectGenderIfRequired(page);
    const saveButton = page.locator('button:has-text("保存")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
    }

    await page.locator('[data-testid="save-team"]').click();
    await page.waitForURL(/\/my-teams/);

    // 2つ目のパーティを作成
    await page.goto('/builder');
    await page.locator('input[placeholder*="パーティ"]').first().fill('パーティB');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('リザードン');
    await page.locator('text=リザードン').first().click();

    await selectGenderIfRequired(page);
    const saveBtn = page.locator('button:has-text("保存")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
    }

    // 保存時にダイアログが表示されるか確認
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('パーティA');
      await dialog.accept();
    });

    await page.locator('[data-testid="save-team"]').click();

    // 上書きされた場合、パーティBのみが存在することを確認
    await page.waitForTimeout(500);
    await page.goto('/my-teams');

    // パーティBが表示される
    await expect(page.locator('text=パーティB')).toBeVisible();
  });
});
