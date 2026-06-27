import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { SaveTeamBodySchema, checkContentLength } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabase, toTeam, TeamRow } from '@/lib/supabase';

/**
 * GET /api/teams - ユーザーの全パーティを取得
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rl = await rateLimit(`get-teams:${userId}`, 60, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching teams from Supabase:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    const teams = (data as TeamRow[]).map(toTeam);

    return NextResponse.json({
      success: true,
      teams,
      count: teams.length,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams - パーティを保存または更新
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

    const rl = await rateLimit(`post-teams:${userId}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    if (!checkContentLength(request)) {
      return NextResponse.json(
        { success: false, error: 'Request body too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const result = SaveTeamBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid team data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { team, overwrite, baseUpdatedAt } = result.data;
    const supabase = getSupabase();

    // 既存行（1ユーザー=1行）の確認。確認ダイアログ用＋competitive判定用。
    const { data: existing, error: selectError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing team:', selectError);
      return NextResponse.json(
        { success: false, error: 'Failed to save team' },
        { status: 500 }
      );
    }

    // 別パーティが既にある状態で新規保存しようとした場合は確認を促す（UXのみ）。
    // 実際の書き込みは下の RPC がアトミックに行うため、この事前チェックは助言的。
    if (existing && existing.id !== team.id && !overwrite) {
      return NextResponse.json(
        {
          success: false,
          needsConfirmation: true,
          existingTeamName: (existing as TeamRow).name ?? '',
          message: 'Team limit reached',
        },
        { status: 409 }
      );
    }

    // アトミックな保存＋楽観ロック（INSERT ... ON CONFLICT(user_id) DO UPDATE ... WHERE updated_at=base）
    // overwrite=true のときは base を無視して強制上書き。
    const { data: saved, error: rpcError } = await supabase.rpc('save_team', {
      p_user_id: userId,
      p_id: team.id,
      p_name: team.name,
      p_pokemon: team.pokemon,
      p_base_updated_at: overwrite ? null : baseUpdatedAt ?? null,
    });

    if (rpcError) {
      console.error('Error saving team (rpc):', rpcError);
      return NextResponse.json(
        { success: false, error: 'Failed to save team' },
        { status: 500 }
      );
    }

    const savedRow = Array.isArray(saved) ? (saved[0] as TeamRow | undefined) : (saved as TeamRow | undefined);

    if (!savedRow) {
      // 0行 = 楽観ロック競合（他端末が先に更新）。現行行を返して競合UXを出させる。
      const { data: current } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return NextResponse.json(
        {
          success: false,
          code: 'VERSION_CONFLICT',
          currentTeam: current ? toTeam(current as TeamRow) : undefined,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      team: toTeam(savedRow),
      needsConfirmation: false,
    });
  } catch (error) {
    console.error('Error saving team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save team' },
      { status: 500 }
    );
  }
}
