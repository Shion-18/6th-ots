import { Page } from '@playwright/test';

/**
 * オス・メス両方いる種族は性別の選択が必須なので、
 * エディタに性別の選択欄が出ていればオスを選ぶ。
 * 単性・性別不明の種族では選択欄が出ないため何もしない。
 */
export async function selectGenderIfRequired(page: Page) {
  const male = page.locator('[role="dialog"] button:has-text("♂ オス")');
  if ((await male.count()) > 0) {
    await male.click();
  }
}
