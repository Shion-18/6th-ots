import { Team } from '@/types/pokemon';

/**
 * チームの共有スナップショットをサーバに作成し、ショートURLを返す。
 * 共有しやすい短いURL（/view/<shortId>）になる。
 */
export async function createShareUrl(team: Team): Promise<string> {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team }),
  });

  const data = await response.json();
  if (!response.ok || !data.success || !data.shortId) {
    throw new Error(data.error || '共有リンクの作成に失敗しました');
  }

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/view/${data.shortId}`;
}
