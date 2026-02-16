import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'pokemon-app-user-id';

/**
 * ユーザーIDを取得する。存在しない場合は新規生成する。
 *
 * @returns ユーザーID (UUID v4形式)
 * @throws クライアント側でのみ呼び出し可能
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getUserId can only be called on client side');
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * UUIDの形式を検証する
 *
 * @param uuid 検証対象のUUID文字列
 * @returns 有効なUUID v4形式の場合true
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * ユーザーIDをリセットする（デバッグ用）
 */
export function resetUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_ID_KEY);
}
