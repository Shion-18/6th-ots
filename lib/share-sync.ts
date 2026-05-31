import { kv } from '@vercel/kv';
import { Team } from '@/types/pokemon';

export const SHARE_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface SyncResult {
  updated: boolean;
  shortId?: string;
}

/**
 * 指定 teamId に紐付く共有スナップショット (share:{shortId}) があれば、
 * 最新の team で上書きし TTL を延長する。なければ何もしない。
 * チーム保存と非同期に呼ばれるため、失敗してもチーム保存自体は成功させたい想定。
 */
export async function syncShareSnapshot(teamId: string, team: Team): Promise<SyncResult> {
  const reverseKey = `team:${teamId}:share`;
  const shortId = await kv.get<string>(reverseKey);

  if (!shortId) {
    return { updated: false };
  }

  await kv.set(`share:${shortId}`, team, { ex: SHARE_TTL_SECONDS });
  await kv.set(reverseKey, shortId, { ex: SHARE_TTL_SECONDS });

  return { updated: true, shortId };
}
