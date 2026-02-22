import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'poke-session';
const SERVER_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

/**
 * セッショントークンを生成する (userId.hmac)
 */
export function createSessionToken(userId: string): string {
  const hmac = crypto.createHmac('sha256', SERVER_SECRET).update(userId).digest('hex');
  return `${userId}.${hmac}`;
}

/**
 * セッショントークンを検証し、userIdを返す
 */
export function verifySessionToken(token: string): string | null {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return null;

  const userId = token.substring(0, dotIndex);
  const hmac = token.substring(dotIndex + 1);
  if (!userId || !hmac) return null;

  const expectedHmac = crypto.createHmac('sha256', SERVER_SECRET).update(userId).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  return userId;
}

/**
 * リクエストのCookieからuserIdを取得・検証する
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) return null;
  return verifySessionToken(sessionCookie.value);
}

export { SESSION_COOKIE };
