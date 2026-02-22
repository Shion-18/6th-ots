import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { nanoid } from 'nanoid';
import { ShareTeamBodySchema, checkContentLength } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

const DEFAULT_TTL = 30 * 24 * 60 * 60; // 30日（秒）

/**
 * POST /api/share - 共有リンクを生成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // レートリミット: 10回/分（userId単位）
    const rateLimitResult = await rateLimit(`share:post:${userId}`, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    if (!checkContentLength(request)) {
      return NextResponse.json(
        { success: false, error: 'Request body too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const result = ShareTeamBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid team data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { team, ttl = DEFAULT_TTL } = result.data;

    // 共有ID生成（21文字のURL-safe文字列、128ビットエントロピー）
    const shareId = nanoid(21);
    const key = `shared:${shareId}`;

    // KVに保存（TTL付き）
    await kv.set(key, team, { ex: ttl });

    // 共有URL生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    request.headers.get('origin') ||
                    'http://localhost:3003';
    const shareUrl = `${baseUrl}/view?shareId=${shareId}`;

    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
