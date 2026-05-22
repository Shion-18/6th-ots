import { test, expect } from '@playwright/test';

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
    await page.locator('[data-testid="save-pokemon"]').click();

    await page.locator('[data-testid="save-team"]').click();
    await page.waitForURL(/\/my-teams/);

    // 共有ボタンをクリック
    const shareButton = page.locator('button:has-text("共有")').first();
    await shareButton.click();

    // QRモーダルが表示されるまで待機
    await page.waitForSelector('input[type="url"]', { timeout: 10000 });

    // 共有URLを取得（readOnly input[type="url"]）
    const shareUrl = await page.locator('input[type="url"]').inputValue();
    expect(shareUrl).toMatch(/\/view\?shareId=/);

    // QRコード（SVG）が表示されていることを確認
    const qrSvg = page.locator('#qr-code-svg');
    await expect(qrSvg).toBeVisible();

    // 共有URLを開いてパーティが表示されることを確認
    const urlPath = new URL(shareUrl).pathname + new URL(shareUrl).search;
    await page.goto(urlPath);
    await expect(page.locator('text=共有テスト')).toBeVisible();
    await expect(page.locator('text=ピカチュウ')).toBeVisible();
  });
});
