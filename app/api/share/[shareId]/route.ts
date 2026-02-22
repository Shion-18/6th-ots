import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { ShareIdSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/share/[shareId] - 共有されたパーティを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    // レートリミット: 60回/分（IP単位）
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitResult = await rateLimit(`share:get:${ip}`, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    const { shareId } = await params;

    // shareIdのバリデーション
    if (!ShareIdSchema.safeParse(shareId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid share ID' },
        { status: 400 }
      );
    }

    const key = `shared:${shareId}`;
    const team = await kv.get<Team>(key);

    if (!team) {
      // 期限切れまたは存在しない
      return NextResponse.json(
        { success: false, error: 'Share link expired or not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error fetching shared team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shared team' },
      { status: 500 }
    );
  }
}
