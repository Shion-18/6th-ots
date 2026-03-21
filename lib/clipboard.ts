/**
 * クリップボードにテキストをコピーする共通ユーティリティ
 * navigator.clipboard.writeText のラッパー
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
