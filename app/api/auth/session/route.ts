import { NextRequest, NextResponse } from 'next/server';
import { isValidUUID } from '@/lib/user-id';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';

/**
 * POST /api/auth/session - セッションCookieを発行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const token = createSessionToken(userId);
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session - セッション状態を確認
 */
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false });
  }

  // Cookie存在の確認のみ（検証はサーバー側の各APIルートで行う）
  return NextResponse.json({ authenticated: true });
}
