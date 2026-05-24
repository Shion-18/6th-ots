import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { TeamIdSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { getSupabase } from '@/lib/supabase';

/**
 * DELETE /api/teams/[teamId] - 特定のパーティを削除
 */
export async function DELETE(
  _request: NextRequest,
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

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete team' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedTeamId: teamId,
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
