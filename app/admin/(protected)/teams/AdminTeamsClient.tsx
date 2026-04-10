'use client';

import { useCallback, useEffect, useState } from 'react';
import { Team } from '@/types/pokemon';

interface AdminTeamEntry {
  userId: string;
  team: Team;
}

export default function AdminTeamsClient() {
  const [entries, setEntries] = useState<AdminTeamEntry[]>([]);
  const [cursor, setCursor] = useState('0');
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teams?cursor=${cursor}&count=50`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load teams');
        return;
      }
      setEntries((prev) => [...prev, ...(data.entries as AdminTeamEntry[])]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(entry: AdminTeamEntry) {
    const key = `${entry.userId}:${entry.team.id}`;
    if (!confirm(`「${entry.team.name}」を削除します。よろしいですか？`)) return;
    setDeletingKey(key);
    try {
      const res = await fetch(
        `/api/admin/teams/${encodeURIComponent(entry.userId)}/${encodeURIComponent(entry.team.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`削除に失敗しました: ${data.error || 'unknown'}`);
        return;
      }
      setEntries((prev) => prev.filter((e) => !(e.userId === entry.userId && e.team.id === entry.team.id)));
    } catch (e) {
      alert(`削除に失敗しました: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left px-4 py-2">チーム名</th>
              <th className="text-left px-4 py-2">ポケモン数</th>
              <th className="text-left px-4 py-2">更新日時</th>
              <th className="text-left px-4 py-2">userId</th>
              <th className="text-left px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  チームが見つかりませんでした。
                </td>
              </tr>
            )}
            {entries.map((entry) => {
              const key = `${entry.userId}:${entry.team.id}`;
              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium">{entry.team.name}</td>
                  <td className="px-4 py-2">{entry.team.pokemon?.length ?? 0}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {entry.team.updatedAt
                      ? new Date(entry.team.updatedAt).toLocaleString('ja-JP')
                      : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                    {entry.userId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      disabled={deletingKey === key}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingKey === key ? '削除中…' : '削除'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center">
        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? '読み込み中…' : 'さらに読み込む'}
          </button>
        ) : (
          <span className="text-sm text-gray-500">以上です</span>
        )}
      </div>
    </div>
  );
}
