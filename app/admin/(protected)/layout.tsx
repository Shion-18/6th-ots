import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/admin-session';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold">管理画面</h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                ダッシュボード
              </Link>
              <Link href="/admin/teams" className="text-gray-700 hover:text-gray-900">
                チーム一覧
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">@{session.username}</span>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="text-gray-600 hover:text-red-600 underline"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
