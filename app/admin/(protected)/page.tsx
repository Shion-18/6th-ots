import { headers } from 'next/headers';

interface Stats {
  userCount: number;
  teamCount: number;
  kvStatus: string;
}

async function fetchStats(): Promise<{ stats: Stats | null; error: string | null }> {
  try {
    const hdrs = await headers();
    const host = hdrs.get('host');
    const proto = hdrs.get('x-forwarded-proto') || 'http';
    const cookie = hdrs.get('cookie') || '';
    const res = await fetch(`${proto}://${host}/api/admin/stats`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { stats: data.stats || null, error: data.error || 'Failed to fetch stats' };
    }
    return { stats: data.stats, error: null };
  } catch (error) {
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default async function AdminDashboard() {
  const { stats, error } = await fetchStats();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">ダッシュボード</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          統計の取得に失敗しました: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">総ユーザー数</div>
          <div className="text-3xl font-bold mt-1">{stats?.userCount ?? '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">総チーム数</div>
          <div className="text-3xl font-bold mt-1">{stats?.teamCount ?? '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">KV 接続</div>
          <div
            className={`text-3xl font-bold mt-1 ${
              stats?.kvStatus === 'ok' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {stats?.kvStatus === 'ok' ? 'OK' : 'Error'}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        ※ ユーザーとチームの集計は KV の `user:*:teams` キーを scan しています。
      </p>
    </div>
  );
}
