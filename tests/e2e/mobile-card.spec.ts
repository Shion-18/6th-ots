import { test, expect } from '@playwright/test';
import { selectGenderIfRequired } from './helpers';

// チャンピオンズ風カードのスマホ表示検証:
// 技4つ・特性・性格・持ち物がすべて省略されずに見えること
test.describe('スマホ表示のポケモンカード', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('性格を設定でき、技・特性・性格・持ち物が全部カードに表示される', async ({ page }) => {
    await page.goto('/builder');

    await page.locator('input[placeholder*="パーティ"]').first().fill('スマホ表示テスト');

    await page.locator('button:has-text("ポケモンを追加")').click();
    await page.locator('input[placeholder*="検索"]').first().fill('ピカチュウ');
    await page.locator('text=ピカチュウ').first().click();

    // 長めの技名を含む4つの技
    const moves = ['１０まんボルト', 'でんじは', 'アイアンテール', 'ボルトチェンジ'];
    for (const move of moves) {
      const moveInput = page.locator('input[placeholder*="技"]').first();
      await moveInput.fill(move);
      await page.waitForTimeout(300);
      await page.locator(`text=${move}`).first().click();
    }

    // 持ち物
    const itemInput = page.locator('input[placeholder*="持ち物"]').first();
    await itemInput.fill('こだわりスカーフ');
    await page.locator('text=こだわりスカーフ').first().click();

    // 性格
    await page.locator('[data-testid="nature-select"]').selectOption('ようき');

    await selectGenderIfRequired(page);
    await page.locator('[data-testid="save-pokemon"]').click();

    // カードに全項目が表示される
    for (const move of moves) {
      await expect(page.getByText(move, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText('ようき', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('こだわりスカーフ', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('せいでんき', { exact: true }).first()).toBeVisible();

    // 技名が横方向にはみ出していない（CSSクリップ検出）
    for (const move of moves) {
      const overflows = await page
        .getByText(move, { exact: true })
        .first()
        .evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(overflows, `技名「${move}」がはみ出さずに表示されること`).toBe(false);
    }
  });
});
