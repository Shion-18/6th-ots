import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/admin-session';

/**
 * admin-session Cookie を削除してログイン画面へリダイレクトする。
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  const url = new URL(req.url);
  return NextResponse.redirect(new URL('/admin/login', url.origin), {
    status: 303,
  });
}
