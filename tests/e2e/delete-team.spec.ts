import { test, expect } from '@playwright/test';

test.describe('パーティ削除', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('パーティを削除できる', async ({ page }) => {
    // パーティを作成・保存
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('削除テスト');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    const saveButton = page.locator('button:has-text("保存")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
    }

    await page.locator('button:has-text("パーティを保存")').click();
    await page.waitForURL(/\/my-teams/);

    // パーティが表示されることを確認
    await expect(page.locator('text=削除テスト')).toBeVisible();

    // 削除ボタンをクリック
    const deleteButton = page.locator('button:has-text("削除")').first();

    // ダイアログハンドラを設定
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await deleteButton.click();

    // パーティが削除されたことを確認
    await page.waitForTimeout(500);
    const teamExists = await page.locator('text=削除テスト').count();
    expect(teamExists).toBe(0);

    // ビルダーページでも表示されないことを確認
    await page.goto('/builder');
    await page.waitForTimeout(300);
    const builderTeamExists = await page.locator('text=削除テスト').count();
    expect(builderTeamExists).toBe(0);
  });
});
