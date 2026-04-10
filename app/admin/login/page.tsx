interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: 'OAuthパラメータが不足しています。',
  invalid_state: 'セッションの検証に失敗しました。もう一度お試しください。',
  not_configured: 'GitHub OAuth が設定されていません。',
  token_exchange_failed: 'GitHub 認証に失敗しました。',
  token_exchange_error: 'GitHub への接続に失敗しました。',
  user_fetch_failed: 'GitHub ユーザー情報の取得に失敗しました。',
  user_fetch_error: 'GitHub への接続に失敗しました。',
  no_username: 'GitHub ユーザー名を取得できませんでした。',
  not_allowed: 'このアカウントは管理者として許可されていません。',
  session_create_failed: 'セッションの発行に失敗しました。',
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorKey = params?.error;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] || 'エラーが発生しました。' : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">管理画面ログイン</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          開発者専用。GitHub アカウントで認証します。
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <a
          href="/api/admin/oauth/start"
          className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded transition-colors"
        >
          GitHub でログイン
        </a>
      </div>
    </div>
  );
}
