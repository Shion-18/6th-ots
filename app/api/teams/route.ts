import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { isValidUUID } from '@/lib/user-id';

/**
 * GET /api/teams - ユーザーの全パーティを取得
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing user ID' },
        { status: 400 }
      );
    }

    const key = `user:${userId}:teams`;
    const teams = await kv.get<Team[]>(key);

    return NextResponse.json({
      success: true,
      teams: teams || [],
      count: teams?.length || 0
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
    const userId = request.headers.get('x-user-id');

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { team, overwrite = false } = body;

    // バリデーション
    if (!team || !team.id || !team.name || !Array.isArray(team.pokemon)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team data' },
        { status: 400 }
      );
    }

    const key = `user:${userId}:teams`;
    const existingTeams = await kv.get<Team[]>(key) || [];

    const teamIndex = existingTeams.findIndex(t => t.id === team.id);

    if (teamIndex >= 0) {
      // 既存パーティの更新
      existingTeams[teamIndex] = team;
      await kv.set(key, existingTeams);

      return NextResponse.json({
        success: true,
        team,
        needsConfirmation: false
      });
    } else {
      // 新規パーティの保存
      if (existingTeams.length >= 1 && !overwrite) {
        // 1パーティ制限に達している
        return NextResponse.json({
          success: false,
          needsConfirmation: true,
          existingTeamName: existingTeams[0].name,
          message: 'Team limit reached'
        }, { status: 409 });
      }

      if (overwrite) {
        // 既存パーティを全て上書き
        await kv.set(key, [team]);
      } else {
        // 追加
        existingTeams.push(team);
        await kv.set(key, existingTeams);
      }

      return NextResponse.json({
        success: true,
        team,
        needsConfirmation: false
      });
    }
  } catch (error) {
    console.error('Error saving team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save team' },
      { status: 500 }
    );
  }
}
