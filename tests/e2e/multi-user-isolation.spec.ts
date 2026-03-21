import { test, expect, BrowserContext, Page } from '@playwright/test';

/**
 * 複数ユーザーのパーティ保存が互いに干渉しないことをテスト
 * browser.newContext() で独立したセッションを持つ2ユーザーを作成
 */

/** パーティ作成 → 保存 → my-teamsへ遷移するヘルパー */
async function createAndSaveTeam(page: Page, teamName: string, pokemonName: string) {
  // localStorageクリア + dialogハンドラー
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  page.on('dialog', dialog => dialog.accept());

  // ビルダーでパーティ作成
  await page.goto('/builder');
  await page.locator('input[placeholder*="パーティ"]').first().fill(teamName);

  // ポケモン追加
  await page.locator('button:has-text("ポケモンを追加")').click();
  await page.locator('input[placeholder*="検索"]').first().fill(pokemonName);
  await page.locator(`text=${pokemonName}`).first().click();

  // 技を1つ追加（保存ボタン有効化に必要）
  const moveInput = page.locator('input[placeholder*="技"]').first();
  await moveInput.fill('まもる');
  await page.waitForTimeout(300);
  await page.locator('text=まもる').first().click();

  // ポケモン保存
  await page.locator('[data-testid="save-pokemon"]').click();

  // パーティ保存
  await page.locator('[data-testid="save-team"]').click();
  await page.waitForURL(/\/my-teams/);
}

test.describe('マルチユーザー保存分離', () => {
  test('ユーザーAとBが別々にパーティを保存し、互いに見えない', async ({ browser }) => {
    // --- ユーザーA: 「チームA」を保存 ---
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await createAndSaveTeam(pageA, 'チームA', 'ピカチュウ');

    // ユーザーAのmy-teamsに「チームA」が表示される
    await expect(pageA.locator('text=チームA')).toBeVisible();

    // --- ユーザーB: 「チームB」を保存 ---
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await createAndSaveTeam(pageB, 'チームB', 'リザードン');

    // ユーザーBのmy-teamsに「チームB」が表示される
    await expect(pageB.locator('text=チームB')).toBeVisible();

    // ユーザーBには「チームA」が見えない（ユーザー分離）
    await expect(pageB.locator('text=チームA')).not.toBeVisible();

    // --- ユーザーA: まだ「チームA」だけ見える ---
    await pageA.goto('/my-teams');
    await expect(pageA.locator('text=チームA')).toBeVisible();
    await expect(pageA.locator('text=チームB')).not.toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
