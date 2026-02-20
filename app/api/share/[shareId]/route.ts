import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';

/**
 * GET /api/share/[shareId] - 共有されたパーティを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    // shareIdの基本的なバリデーション
    if (!shareId || shareId.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid share ID' },
        { status: 400 }
      );
    }

    const key = `shared:${shareId}`;
    const team = await kv.get<Team>(key);

    if (!team) {
      // 期限切れまたは存在しない
      return NextResponse.json(
        { success: false, error: 'Share link expired or not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error fetching shared team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shared team' },
      { status: 500 }
    );
  }
}
