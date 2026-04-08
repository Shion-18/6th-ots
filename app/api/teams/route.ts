import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { getSessionUserId } from '@/lib/session';
import { SaveTeamBodySchema, checkContentLength } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/teams - ユーザーの全パーティを取得
 */
export async function GET(request: NextRequest) {
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

    const key = `user:${userId}:teams`;
    const existingTeams = await kv.get<Team[]>(key) || [];

    const teamIndex = existingTeams.findIndex(t => t.id === team.id);

    if (teamIndex >= 0) {
      // 既存パーティの更新 — 楽観的ロックで競合検知
      const existing = existingTeams[teamIndex];
      const existingVersion = existing.version ?? 0;
      const incomingVersion = team.version ?? 0;

      if (incomingVersion < existingVersion) {
        // クライアントが古いバージョンを送信 → 競合
        return NextResponse.json({
          success: false,
          error: 'conflict',
          message: '別のタブまたはデバイスで更新されています。最新データを読み込んでください。',
          serverVersion: existingVersion,
          serverTeam: existing,
        }, { status: 409 });
      }

      const updatedTeam = { ...team, version: existingVersion + 1, updatedAt: new Date().toISOString() };
      existingTeams[teamIndex] = updatedTeam;
      await kv.set(key, existingTeams);

      return NextResponse.json({
        success: true,
        team: updatedTeam,
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

      const newTeam = { ...team, version: 1, updatedAt: new Date().toISOString() };

      if (overwrite) {
        // 既存パーティを全て上書き
        await kv.set(key, [newTeam]);
      } else {
        existingTeams.push(newTeam);
        await kv.set(key, existingTeams);
      }

      return NextResponse.json({
        success: true,
        team: newTeam,
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
