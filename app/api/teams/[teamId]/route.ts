import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { getSessionUserId } from '@/lib/session';
import { TeamIdSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * DELETE /api/teams/[teamId] - 特定のパーティを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rl = await rateLimit(`delete-teams:${userId}`, 20, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    const { teamId } = await params;

    if (!TeamIdSchema.safeParse(teamId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const key = `user:${userId}:teams`;
    const teams = await kv.get<Team[]>(key) || [];

    const filteredTeams = teams.filter(t => t.id !== teamId);

    if (filteredTeams.length === teams.length) {
      // パーティが見つからない
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    await kv.set(key, filteredTeams);

    return NextResponse.json({
      success: true,
      deletedTeamId: teamId
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
