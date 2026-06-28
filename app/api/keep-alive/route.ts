import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/keep-alive
 * Supabase 無料プランの自動停止（無操作7日でpause）を防ぐためのキープアライブ。
 * Vercel Cron（vercel.json の crons）から1日1回呼ばれ、DBへ軽量クエリを発行して
 * 「アクティブ」状態を維持する。
 *
 * セキュリティ: CRON_SECRET を設定している場合は Vercel Cron が付与する
 * Authorization: Bearer <CRON_SECRET> を検証する（未設定なら read-only なので素通し）。
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = getSupabase();
    // 行を読まない軽量なヘッドクエリ（件数のみ）。DBアクセス＝アクティブ判定に十分。
    const { error } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('keep-alive query failed:', error);
      return NextResponse.json({ ok: false, error: 'db error' }, { status: 200 });
    }

    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (error) {
    // 接続失敗でも「叩いたこと」自体がウェイク要因になり得るため 200 で返す
    console.error('keep-alive failed:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
