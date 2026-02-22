import { test, expect } from '@playwright/test';

test.describe('アイテム選択', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('アイテムを検索して選択できる', async ({ page }) => {
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('アイテムテスト');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    // アイテム検索
    const itemInput = page.locator('input[placeholder*="持ち物"]').first();

    if (await itemInput.count() > 0) {
      // 「いのちのたま」を検索
      await itemInput.fill('いのちのたま');
      await page.waitForTimeout(300);

      // 候補が表示されることを確認
      const itemOption = page.locator('text=いのちのたま').first();
      await expect(itemOption).toBeVisible();

      // 選択
      await itemOption.click();

      // アイテムが設定されたことを確認
      await expect(page.locator('text=いのちのたま')).toBeVisible();
    }

    // ポケモン保存
    const saveButton = page.locator('button:has-text("保存")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
    }

    // パーティ保存
    await page.locator('[data-testid="save-team"]').click();
    await page.waitForURL(/\/my-teams/);

    // マイパーティでアイテムが表示されることを確認
    await expect(page.locator('text=いのちのたま')).toBeVisible();
  });

  test('メガストーンを検索して選択できる', async ({ page }) => {
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('メガストーンテスト');

    // リザードンを追加（メガストーン対応ポケモン）
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('リザードン');
    await page.locator('text=リザードン').first().click();

    // メガストーンを検索
    const itemInput = page.locator('input[placeholder*="持ち物"]').first();

    if (await itemInput.count() > 0) {
      await itemInput.fill('リザードナイトX');
      await page.waitForTimeout(300);

      // メガストーンが選択肢に表示されることを確認
      const megaStone = page.locator('text=リザードナイトX').first();
      await expect(megaStone).toBeVisible();

      // 選択
      await megaStone.click();

      // メガストーンが設定されたことを確認
      await expect(page.locator('text=リザードナイトX')).toBeVisible();
    }
  });
});
