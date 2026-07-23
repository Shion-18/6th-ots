import { NextRequest, NextResponse } from 'next/server';
import { ShortIdSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';
import { Team } from '@/types/pokemon';

/**
 * GET /api/share/[shortId]
 * 共有スナップショットを取得する（公開・認証不要）。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    if (!ShortIdSchema.safeParse(shortId).success) {
      return NextResponse.json({ success: false, error: 'Invalid share id' }, { status: 400 });
    }

    // 公開エンドポイントのため IP ベースでレート制限
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = await rateLimit(`get-share:${ip}`, 60, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('shares')
      .select('team')
      .eq('short_id', shortId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching share:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch share' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Share not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, team: (data as { team: Team }).team });
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch share' }, { status: 500 });
  }
}
