import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { getAdminSession } from '@/lib/admin-session';

/**
 * GET /api/admin/stats
 * 総ユーザー数・総チーム数・KV 接続状態を返す。
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // KV を scan してユーザー数とチーム数を集計
    let cursor = '0';
    let userCount = 0;
    let teamCount = 0;
    const maxIterations = 100; // 無限ループ防止
    let iterations = 0;

    do {
      const [nextCursor, keys] = await kv.scan(cursor, {
        match: 'user:*:teams',
        count: 100,
      });

      for (const key of keys) {
        userCount++;
        const teams = await kv.get<Team[]>(key);
        if (Array.isArray(teams)) {
          teamCount += teams.length;
        }
      }

      cursor = nextCursor;
      iterations++;
    } while (cursor !== '0' && iterations < maxIterations);

    return NextResponse.json({
      success: true,
      stats: {
        userCount,
        teamCount,
        kvStatus: 'ok',
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      {
        success: false,
        stats: { userCount: 0, teamCount: 0, kvStatus: 'error' },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
