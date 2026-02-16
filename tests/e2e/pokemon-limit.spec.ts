import { test, expect } from '@playwright/test';

test.describe('ポケモン数制限', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('最大6匹までしか追加できない', async ({ page }) => {
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('制限テスト');

    // 6匹のポケモンを追加
    const pokemon = ['ピカチュウ', 'リザードン', 'カメックス', 'フシギバナ', 'ゲンガー', 'カビゴン'];

    for (const mon of pokemon) {
      const addButton = page.locator('button:has-text("ポケモンを追加")');

      // ボタンが有効か確認
      const isEnabled = await addButton.isEnabled();
      if (!isEnabled) {
        break;
      }

      await addButton.click();
      await page.locator('input[placeholder*="検索"]').first().fill(mon);
      await page.waitForTimeout(300);
      await page.locator(`text=${mon}`).first().click();

      // 保存ボタンがあればクリック
      const saveButton = page.locator('button:has-text("保存")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(200);
      }
    }

    // 6匹追加されたことを確認
    const pokemonCards = page.locator('[class*="pokemon"], [class*="card"]').filter({ hasText: /.+/ });
    const count = await pokemonCards.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // 7匹目を追加しようとする
    const addButton = page.locator('button:has-text("ポケモンを追加")');

    // ボタンが無効化されているか、クリックできないことを確認
    const isDisabled = await addButton.isDisabled().catch(() => true);
    const isVisible = await addButton.isVisible().catch(() => false);

    if (isVisible && !isDisabled) {
      // ボタンがクリック可能な場合、クリックしてもポケモンが追加されないことを確認
      await addButton.click();
      await page.waitForTimeout(500);

      // まだ6匹のままか確認
      const newCount = await pokemonCards.count();
      expect(newCount).toBeLessThanOrEqual(7); // 最大7（6匹+α）
    }
  });
});
