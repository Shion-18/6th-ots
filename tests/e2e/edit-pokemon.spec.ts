import { test, expect } from '@playwright/test';

test.describe('既存ポケモンの編集', () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('ポケモンの技とアイテムを編集できる', async ({ page }) => {
    // まずパーティを作成
    await page.goto('/builder');

    const nameInput = page.locator('input[placeholder*="パーティ"]').first();
    await nameInput.fill('編集テスト');

    // ポケモン追加
    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    // 初期技を追加
    const moves = ['１０まんボルト', 'でんじは', 'アイアンテール', 'ボルテッカー'];
    for (const move of moves) {
      const moveInput = page.locator('input[placeholder*="技"]').first();
      await moveInput.fill(move);
      await page.waitForTimeout(300);
      await page.locator(`text=${move}`).first().click();
    }

    // アイテムを設定
    const itemInput = page.locator('input[placeholder*="アイテム"]').first();
    if (await itemInput.count() > 0) {
      await itemInput.fill('いのちのたま');
      await page.locator('text=いのちのたま').first().click();
    }

    // ポケモン保存
    const saveButton = page.locator('button:has-text("保存")').first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
    }

    // パーティ保存
    await page.locator('button:has-text("パーティを保存")').click();
    await page.waitForURL(/\/my-teams/);

    // 編集ボタンをクリック
    await page.locator('button:has-text("編集")').first().click();
    await page.waitForURL(/\/builder/);

    // ポケモンカードの編集ボタンをクリック
    await page.locator('button:has-text("編集")').filter({ hasText: /編集|へんしゅう/ }).first().click();

    // 技を1つ削除
    const deleteButton = page.locator('button:has-text("×")').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
    }

    // 新しい技を追加
    const newMoveInput = page.locator('input[placeholder*="技"]').first();
    await newMoveInput.fill('くさむすび');
    await page.waitForTimeout(300);
    await page.locator('text=くさむすび').first().click();

    // アイテムを変更
    const newItemInput = page.locator('input[placeholder*="アイテム"]').first();
    if (await newItemInput.count() > 0) {
      await newItemInput.clear();
      await newItemInput.fill('こだわりスカーフ');
      await page.locator('text=こだわりスカーフ').first().click();
    }

    // 保存
    const updateButton = page.locator('button:has-text("保存")').first();
    if (await updateButton.count() > 0) {
      await updateButton.click();
    }

    // 変更が反映されたか確認
    await expect(page.locator('text=くさむすび')).toBeVisible();
    await expect(page.locator('text=こだわりスカーフ')).toBeVisible();

    // パーティ保存
    await page.locator('button:has-text("パーティを保存")').click();

    // リロードして永続化を確認
    await page.reload();
    await expect(page.locator('text=くさむすび')).toBeVisible();
  });
});
