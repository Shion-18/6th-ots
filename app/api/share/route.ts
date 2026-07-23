import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSessionUserId } from '@/lib/session';
import { ShareTeamBodySchema, checkContentLength } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/share
 * チームのスナップショットを保存し、共有用のショートIDを発行する。
 * 同一ユーザー×同一チームの共有が既にあれば short_id を再利用し、内容を最新へ更新する。
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
    const supabase = getSupabase();
    const now = new Date().toISOString();

    // 既存の共有（同一ユーザー×同一チーム）があれば short_id を再利用して最新化
    const { data: existing, error: selectError } = await supabase
      .from('shares')
      .select('short_id')
      .eq('user_id', userId)
      .eq('team_id', team.id)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing share:', selectError);
      return NextResponse.json({ success: false, error: 'Failed to create share' }, { status: 500 });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('shares')
        .update({ team, updated_at: now })
        .eq('short_id', (existing as { short_id: string }).short_id);

      if (updateError) {
        console.error('Error updating share:', updateError);
        return NextResponse.json({ success: false, error: 'Failed to create share' }, { status: 500 });
      }

      return NextResponse.json({ success: true, shortId: (existing as { short_id: string }).short_id });
    }

    const shortId = nanoid(8);
    const { error: insertError } = await supabase
      .from('shares')
      .insert({ short_id: shortId, user_id: userId, team_id: team.id, team, created_at: now, updated_at: now });

    if (insertError) {
      console.error('Error inserting share:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to create share' }, { status: 500 });
    }

    return NextResponse.json({ success: true, shortId });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ success: false, error: 'Failed to create share' }, { status: 500 });
  }
}
