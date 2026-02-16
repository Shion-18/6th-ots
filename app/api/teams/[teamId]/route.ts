import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { isValidUUID } from '@/lib/user-id';

/**
 * DELETE /api/teams/[teamId] - 特定のパーティを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing user ID' },
        { status: 400 }
      );
    }

    const teamId = params.teamId;
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
