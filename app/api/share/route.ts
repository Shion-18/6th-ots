import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/types/pokemon';
import { isValidUUID } from '@/lib/user-id';
import { nanoid } from 'nanoid';

const DEFAULT_TTL = 30 * 24 * 60 * 60; // 30日（秒）

/**
 * POST /api/share - 共有リンクを生成
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
    const { team, ttl = DEFAULT_TTL } = body;

    // バリデーション
    if (!team || !team.id || !team.name) {
      return NextResponse.json(
        { success: false, error: 'Invalid team data' },
        { status: 400 }
      );
    }

    // 共有ID生成（10文字のURL-safe文字列）
    const shareId = nanoid(10);
    const key = `shared:${shareId}`;

    // KVに保存（TTL付き）
    await kv.set(key, team, { ex: ttl });

    // 共有URL生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    request.headers.get('origin') ||
                    'http://localhost:3003';
    const shareUrl = `${baseUrl}/view?shareId=${shareId}`;

    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
