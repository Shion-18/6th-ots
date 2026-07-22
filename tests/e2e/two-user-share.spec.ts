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

    // 共有URLを取得（現行は短縮URL /view/<shortId>）
    const shareUrl = await pageA.locator('input[type="url"]').inputValue();
    expect(shareUrl).toMatch(/\/view\/[A-Za-z0-9_-]{8}/);

    // QRコード（SVG）が表示されていることを確認
    const qrSvg = pageA.locator('#qr-code-svg');
    await expect(qrSvg).toBeVisible();

    // --- ユーザーB: 共有URLを直接開いてパーティ確認（標準カメラ経由を想定） ---
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    const urlPath = new URL(shareUrl).pathname + new URL(shareUrl).search;
    await pageB.goto(urlPath);

    // パーティ名が表示されること
    await expect(pageB.locator('text=共有テストA')).toBeVisible({ timeout: 10000 });

    // ポケモンが表示されること
    await expect(pageB.locator('text=ピカチュウ')).toBeVisible();

    // --- ユーザーC: アプリ内「相手のパーティ」→ URL貼り付けで受信できること ---
    // （短縮URLがアプリ内受信フローで受理され /view/<shortId> に遷移することを担保）
    const contextC = await browser.newContext();
    const pageC = await contextC.newPage();
    await pageC.goto('/');
    await pageC.evaluate(() => localStorage.clear());

    await pageC.locator('button:has-text("相手のパーティ")').click();
    await pageC.locator('button:has-text("URLを入力")').click();
    await pageC.locator('input[type="url"]').fill(shareUrl);
    await pageC.locator('button:has-text("表示")').click();

    // 短縮URLの view ページに遷移し、パーティが表示されること
    await pageC.waitForURL(/\/view\/[A-Za-z0-9_-]{8}/, { timeout: 10000 });
    await expect(pageC.locator('text=共有テストA')).toBeVisible({ timeout: 10000 });
    await expect(pageC.locator('text=ピカチュウ')).toBeVisible();

    await contextA.close();
    await contextB.close();
    await contextC.close();
  });
});
