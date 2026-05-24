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

    const { team, overwrite } = result.data;
    const supabase = getSupabase();
    const now = new Date().toISOString();

    // 既存チーム（同IDかつ同ユーザー）の確認
    const { data: existing, error: selectError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing team:', selectError);
      return NextResponse.json(
        { success: false, error: 'Failed to save team' },
        { status: 500 }
      );
    }

    if (existing) {
      // 既存チームの更新（同IDが存在）
      const { data: updated, error: updateError } = await supabase
        .from('teams')
        .update({
          name: team.name,
          pokemon: team.pokemon,
          format: team.format ?? null,
          updated_at: now,
        })
        .eq('id', team.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('Error updating team:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update team' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        team: toTeam(updated as TeamRow),
        needsConfirmation: false,
      });
    }

    // 新規保存: 1チーム制限チェック
    const { count, error: countError } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting teams:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to save team' },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= 1 && !overwrite) {
      // 1チーム制限に達している → 既存チーム名を返して確認ダイアログを出させる
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('name')
        .eq('user_id', userId)
        .limit(1)
        .single();

      return NextResponse.json({
        success: false,
        needsConfirmation: true,
        existingTeamName: existingTeam?.name ?? '',
        message: 'Team limit reached',
      }, { status: 409 });
    }

    // 上書きの場合は既存チームを全削除
    if (overwrite) {
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing teams:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to overwrite team' },
          { status: 500 }
        );
      }
    }

    // 新規チーム挿入
    const { data: inserted, error: insertError } = await supabase
      .from('teams')
      .insert({
        id: team.id,
        user_id: userId,
        name: team.name,
        pokemon: team.pokemon,
        format: team.format ?? null,
        created_at: team.createdAt || now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error('Error inserting team:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save team' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      team: toTeam(inserted as TeamRow),
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
