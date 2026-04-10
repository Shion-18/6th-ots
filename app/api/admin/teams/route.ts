import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { getAdminSession } from '@/lib/admin-session';

interface AdminTeamEntry {
  userId: string;
  team: Team;
}

/**
 * GET /api/admin/teams?cursor=0
 * 全ユーザーのチーム一覧をページングで返す。
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cursorParam = req.nextUrl.searchParams.get('cursor') || '0';
  const count = Number(req.nextUrl.searchParams.get('count') || '50');

  try {
    const [nextCursor, keys] = await kv.scan(cursorParam, {
      match: 'user:*:teams',
      count,
    });

    const entries: AdminTeamEntry[] = [];
    for (const key of keys) {
      // key 形式: user:{userId}:teams
      const parts = key.split(':');
      if (parts.length !== 3) continue;
      const userId = parts[1];
      const teams = await kv.get<Team[]>(key);
      if (Array.isArray(teams)) {
        for (const team of teams) {
          entries.push({ userId, team });
        }
      }
    }

    return NextResponse.json({
      success: true,
      entries,
      nextCursor,
      hasMore: nextCursor !== '0',
    });
  } catch (error) {
    console.error('Admin teams list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
