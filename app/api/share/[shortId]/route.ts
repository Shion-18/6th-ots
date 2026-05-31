import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { ShortIdSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/share/[shortId]
 * shortId からスナップショットを取得する。認証不要・レート制限付き。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;

    const parsed = ShortIdSchema.safeParse(shortId);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid shortId' }, { status: 400 });
    }

    // 当てずっぽうアクセス対策：IPベースのレート制限
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rl = await rateLimit(`get-share:${ip}`, 60, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    const team = await kv.get<Team>(`share:${shortId}`);
    if (!team) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch share' }, { status: 500 });
  }
}
