import { test, expect } from '@playwright/test';

test.describe('新規パーティ作成と保存', () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('パーティを作成して保存できる', async ({ page }) => {
    // ビルダーページへ移動
    await page.goto('/builder');

    // パーティ名を入力
    const nameInput = page.locator('input[placeholder*="パーティ"]').first();
    await nameInput.fill('テストパーティ');

    // ポケモン追加ボタンをクリック
    const addButton = page.locator('button:has-text("ポケモンを追加")');
    await addButton.click();

    // ポケモン検索
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await searchInput.fill('ピカチュウ');

    // ピカチュウを選択
    await page.locator('text=ピカチュウ').first().click();

    // アイテムを選択
    const itemInput = page.locator('input[placeholder*="持ち物"]').first();
    if (await itemInput.count() > 0) {
      await itemInput.fill('いのちのたま');
      await page.locator('text=いのちのたま').first().click();
    }

    // 技を選択
    const moves = ['１０まんボルト', 'でんじは', 'アイアンテール', 'ボルテッカー'];
    for (const move of moves) {
      const moveInput = page.locator('input[placeholder*="技"]').first();
      await moveInput.fill(move);
      await page.waitForTimeout(300);
      const moveOption = page.locator(`text=${move}`).first();
      if (await moveOption.isVisible()) {
        await moveOption.click();
      }
    }

    // ポケモンを保存（編集モードから戻る）
    const saveButton = page.locator('button:has-text("保存")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
    }

    // パーティを保存
    const saveTeamButton = page.locator('[data-testid="save-team"]');
    await saveTeamButton.click();

    // マイパーティページへのリダイレクトを確認
    await expect(page).toHaveURL(/\/my-teams/);

    // 保存したパーティが表示されることを確認
    await expect(page.locator('text=テストパーティ')).toBeVisible();
  });
});
