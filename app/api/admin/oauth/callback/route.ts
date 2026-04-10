import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createAdminSessionToken,
  isAllowedAdmin,
  ADMIN_COOKIE,
  ADMIN_TTL_SECONDS,
} from '@/lib/admin-session';
import { rateLimit } from '@/lib/rate-limit';

const STATE_COOKIE = 'admin-oauth-state';

/**
 * GitHub OAuth コールバック。
 * 1. state 検証 (CSRF 対策)
 * 2. code を access_token に交換
 * 3. GitHub API で username を取得
 * 4. allowlist 照合
 * 5. admin-session Cookie を発行して /admin にリダイレクト
 */
export async function GET(req: Request) {
  // レート制限（ブルートフォース対策）
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const rl = await rateLimit(`admin-oauth:${ip}`, 10, 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return redirectToLogin(url.origin, 'missing_params');
  }

  // state 検証
  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    return redirectToLogin(url.origin, 'invalid_state');
  }
  cookieStore.delete(STATE_COOKIE);

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin(url.origin, 'not_configured');
  }

  // access_token を取得
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${url.origin}/api/admin/oauth/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return redirectToLogin(url.origin, 'token_exchange_failed');
    }
    accessToken = tokenData.access_token;
  } catch {
    return redirectToLogin(url.origin, 'token_exchange_error');
  }

  // username を取得
  let username: string;
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': '6thots-app-admin',
        Accept: 'application/vnd.github+json',
      },
    });
    if (!userRes.ok) {
      return redirectToLogin(url.origin, 'user_fetch_failed');
    }
    const userData = await userRes.json();
    username = userData.login;
    if (!username) {
      return redirectToLogin(url.origin, 'no_username');
    }
  } catch {
    return redirectToLogin(url.origin, 'user_fetch_error');
  }

  // allowlist 照合
  if (!isAllowedAdmin(username)) {
    return redirectToLogin(url.origin, 'not_allowed');
  }

  // admin-session Cookie を発行
  try {
    const token = createAdminSessionToken(username);
    cookieStore.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_TTL_SECONDS,
    });
  } catch {
    return redirectToLogin(url.origin, 'session_create_failed');
  }

  return NextResponse.redirect(`${url.origin}/admin`);
}

function redirectToLogin(origin: string, error: string): NextResponse {
  const loginUrl = new URL('/admin/login', origin);
  loginUrl.searchParams.set('error', error);
  return NextResponse.redirect(loginUrl.toString());
}
