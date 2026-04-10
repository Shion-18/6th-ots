import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_COOKIE = 'admin-session';
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const ADMIN_TTL_SECONDS = 24 * 60 * 60; // 24時間

export interface AdminSessionPayload {
  username: string; // GitHub username
  issuedAt: number; // Unix epoch seconds
  expiresAt: number; // Unix epoch seconds
}

/**
 * 管理者セッショントークンを生成する
 * 形式: base64url(payload).hmac
 */
export function createAdminSessionToken(username: string): string {
  if (!ADMIN_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    username,
    issuedAt: now,
    expiresAt: now + ADMIN_TTL_SECONDS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${hmac}`;
}

/**
 * 管理者セッショントークンを検証してpayloadを返す
 */
export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  if (!ADMIN_SECRET) return null;

  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return null;

  const payloadBase64 = token.substring(0, dotIndex);
  const hmac = token.substring(dotIndex + 1);
  if (!payloadBase64 || !hmac) return null;

  const expectedHmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadBase64).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8')) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) return null; // 期限切れ
    return payload;
  } catch {
    return null;
  }
}

/**
 * リクエストのCookieから管理者セッションを取得・検証する
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE);
  if (!cookie) return null;
  return verifyAdminSessionToken(cookie.value);
}

/**
 * GitHub usernameが管理者allowlistに含まれているか判定
 */
export function isAllowedAdmin(username: string): boolean {
  const allowed = (process.env.ADMIN_GITHUB_USERNAMES || '')
    .split(',')
    .map(u => u.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(username.toLowerCase());
}

export { ADMIN_COOKIE, ADMIN_TTL_SECONDS };
