import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { Team } from '@/types/pokemon';
import { getSessionUserId } from '@/lib/session';
import { ShareTeamBodySchema, checkContentLength } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

const SHARE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30日

/**
 * POST /api/share
 * チームをスナップショット保存し、shortId を発行する。
 * 同じ team.id の既存共有があれば shortId を再利用し、TTL を延長する。
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rl = await rateLimit(`post-share:${userId}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    if (!checkContentLength(request)) {
      return NextResponse.json({ success: false, error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const result = ShareTeamBodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid team data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { team } = result.data;

    // 既存 shortId の再利用
    const reverseKey = `team:${team.id}:share`;
    let shortId = await kv.get<string>(reverseKey);

    if (!shortId) {
      shortId = nanoid(8);
    }

    const shareKey = `share:${shortId}`;
    await kv.set(shareKey, team as Team, { ex: SHARE_TTL_SECONDS });
    await kv.set(reverseKey, shortId, { ex: SHARE_TTL_SECONDS });

    return NextResponse.json({ success: true, shortId });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ success: false, error: 'Failed to create share' }, { status: 500 });
  }
}
