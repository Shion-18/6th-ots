import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { getAdminSession } from '@/lib/admin-session';

/**
 * DELETE /api/admin/teams/:userId/:teamId
 * 指定ユーザーの指定チームを削除する。
 */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ userId: string; teamId: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, teamId } = await context.params;

  if (!userId || !teamId) {
    return NextResponse.json(
      { error: 'userId and teamId are required' },
      { status: 400 }
    );
  }

  try {
    const key = `user:${userId}:teams`;
    const teams = (await kv.get<Team[]>(key)) || [];
    const next = teams.filter((t) => t.id !== teamId);

    if (next.length === teams.length) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (next.length === 0) {
      await kv.del(key);
    } else {
      await kv.set(key, next);
    }

    return NextResponse.json({
      success: true,
      deletedBy: admin.username,
      userId,
      teamId,
    });
  } catch (error) {
    console.error('Admin team delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
