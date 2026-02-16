import { test, expect } from '@playwright/test';

test.describe('パーティ共有', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('共有URLを生成して表示できる', async ({ page }) => {
    // パーティを作成・保存
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('共有テスト');

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

    // 共有ボタンをクリック
    const shareButton = page.locator('button:has-text("共有")').first();
    await shareButton.click();

    // 共有URLが生成されることを確認
    await page.waitForTimeout(500);

    // URLに `/view?data=` または `/view?shareId=` が含まれることを確認
    const shareUrlInput = page.locator('input[type="text"]').filter({ hasText: /view/ });
    const shareUrlText = page.locator('text=/view\\?/');

    const hasUrlInput = await shareUrlInput.count() > 0;
    const hasUrlText = await shareUrlText.count() > 0;

    expect(hasUrlInput || hasUrlText).toBeTruthy();

    // QRコードが表示されることを確認
    const qrCode = page.locator('canvas, img[alt*="QR"]');
    const qrExists = await qrCode.count() > 0;
    expect(qrExists).toBeTruthy();

    // 実際の共有URLを取得
    let shareUrl = '';
    if (hasUrlInput) {
      shareUrl = await shareUrlInput.inputValue();
    } else {
      const urlText = await page.locator('text=/http.*view/').first().textContent();
      shareUrl = urlText || '';
    }

    // URLが有効な形式か確認
    expect(shareUrl).toMatch(/\/view\?/);

    // 新しいタブで共有URLを開く（シミュレーション）
    if (shareUrl) {
      const urlParams = new URL(shareUrl, 'http://localhost:3003').search;
      await page.goto(`/view${urlParams}`);

      // パーティが表示されることを確認
      await expect(page.locator('text=共有テスト')).toBeVisible();
      await expect(page.locator('text=ピカチュウ')).toBeVisible();
    }
  });
});
