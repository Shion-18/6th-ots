import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'admin-session';

/**
 * /admin/* を保護するミドルウェア。
 * - /admin/login は誰でもアクセス可能
 * - それ以外の /admin/* は admin-session Cookie が無ければ /admin/login にリダイレクト
 *
 * 注意: Edge ランタイムでは Node の crypto が使えないため、
 *       ここでは Cookie の存在チェックのみ行い、HMAC 検証は
 *       各ページ/APIルートで getAdminSession() 経由で行う。
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login は素通り
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next();
  }

  // Cookie が無ければログインへ
  const cookie = req.cookies.get(ADMIN_COOKIE);
  if (!cookie?.value) {
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
