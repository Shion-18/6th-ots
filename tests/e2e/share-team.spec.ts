import { test, expect } from '@playwright/test';
import { selectGenderIfRequired } from './helpers';

test.describe('パーティ共有', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('共有URLを生成して表示できる', async ({ page }) => {
    // dialogハンドラー（alert/confirmを自動承認）
    page.on('dialog', dialog => dialog.accept());

    // パーティを作成・保存
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('共有テスト');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    // 技を1つ追加（保存ボタン有効化に必要）
    const moveInput = page.locator('input[placeholder*="技"]').first();
    await moveInput.fill('１０まんボルト');
    await page.waitForTimeout(300);
    await page.locator('text=１０まんボルト').first().click();

    // ポケモン保存
    await selectGenderIfRequired(page);
    await page.locator('[data-testid="save-pokemon"]').click();

    await page.locator('[data-testid="save-team"]').click();
    await page.waitForURL(/\/my-teams/);

    // 共有ボタンをクリック
    const shareButton = page.locator('button:has-text("共有")').first();
    await shareButton.click();

    // 共有URLダイアログが表示されるまで待機
    await page.waitForSelector('input[type="url"]', { timeout: 10000 });

    // 共有URLを取得（readOnly input[type="url"]）
    const shareUrl = await page.locator('input[type="url"]').inputValue();
    expect(shareUrl).toMatch(/\/view\/[A-Za-z0-9_-]{8}/);

    // 共有URLを開いてパーティが表示されることを確認
    const urlPath = new URL(shareUrl).pathname + new URL(shareUrl).search;
    await page.goto(urlPath);
    await expect(page.locator('text=共有テスト')).toBeVisible();
    await expect(page.locator('text=ピカチュウ')).toBeVisible();
  });
});
