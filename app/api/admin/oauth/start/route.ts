import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const STATE_COOKIE = 'admin-oauth-state';
const STATE_TTL_SECONDS = 10 * 60; // 10分

/**
 * GitHub OAuth 認可ページへリダイレクトする。
 * CSRF 対策の state を生成して Cookie に保存する。
 */
export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GITHUB_CLIENT_ID is not configured' },
      { status: 500 }
    );
  }

  // CSRF state を生成
  const state = crypto.randomBytes(32).toString('hex');

  // origin を決定（本番では Host ヘッダから）
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/admin/oauth/callback`;

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'read:user');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('allow_signup', 'false');

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL_SECONDS,
  });

  return NextResponse.redirect(authUrl.toString());
}
