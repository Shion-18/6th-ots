import { test, expect } from '@playwright/test';

/**
 * 2ユーザー間のQR共有フローをテスト
 * browser.newContext() で別Cookie/別localStorageの独立ユーザーを作成
 */
test.describe('2ユーザー間QR共有', () => {
  test('ユーザーAが共有したパーティをユーザーBが閲覧できる', async ({ browser }) => {
    // --- ユーザーA: パーティ作成 → 保存 → 共有URL取得 ---
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    // localStorageクリア + dialogハンドラー（alert/confirmを自動承認）
    await pageA.goto('/');
    await pageA.evaluate(() => localStorage.clear());
    pageA.on('dialog', dialog => dialog.accept());

    // ビルダーでパーティ作成
    await pageA.goto('/builder');
    const nameInput = pageA.locator('input[placeholder*="パーティ"]').first();
    await nameInput.fill('共有テストA');

    // ポケモン追加
    await pageA.locator('button:has-text("ポケモンを追加")').click();
    await pageA.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await pageA.locator('text=ピカチュウ').first().click();

    // 技を1つ追加（保存ボタン有効化に必要）
    const moveInput = pageA.locator('input[placeholder*="技"]').first();
    await moveInput.fill('１０まんボルト');
    await pageA.waitForTimeout(300);
    await pageA.locator('text=１０まんボルト').first().click();

    // ポケモン保存
    await pageA.locator('[data-testid="save-pokemon"]').click();

    // パーティ保存
    await pageA.locator('[data-testid="save-team"]').click();
    await pageA.waitForURL(/\/my-teams/);

    // 共有ボタンクリック → QRモーダル表示
    await pageA.locator('button:has-text("共有")').first().click();

    // QRモーダルが表示されるまで待機
    await pageA.waitForSelector('input[type="url"]', { timeout: 10000 });

    // 共有URLを取得
    const shareUrl = await pageA.locator('input[type="url"]').inputValue();
    expect(shareUrl).toMatch(/\/view\?shareId=/);

    // QRコード（SVG）が表示されていることを確認
    const qrSvg = pageA.locator('#qr-code-svg');
    await expect(qrSvg).toBeVisible();

    // --- ユーザーB: 共有URLを開いてパーティ確認 ---
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // ユーザーBは共有URLを直接開く（QRスキャンのシミュレーション）
    const urlPath = new URL(shareUrl).pathname + new URL(shareUrl).search;
    await pageB.goto(urlPath);

    // パーティ名が表示されること
    await expect(pageB.locator('text=共有テストA')).toBeVisible({ timeout: 10000 });

    // ポケモンが表示されること
    await expect(pageB.locator('text=ピカチュウ')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
