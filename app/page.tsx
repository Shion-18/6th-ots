'use client';

import { useRouter } from 'next/navigation';
import CompactPokemonCard from '@/components/ui/CompactPokemonCard';
import { sampleTeam } from '@/lib/sample-team';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            オープンチームシート
          </h1>
          <p className="text-gray-600 mt-2">第6世代ポケモン対戦用</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* ヒーローセクション */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              パーティを共有して<br />対戦を始めよう
            </h2>
            <p className="text-lg text-gray-600">
              オープンチームシートルールで、スムーズに対戦開始
            </p>
          </div>

          {/* アクションボタン */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <button
              onClick={() => router.push('/builder')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-6 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-3xl mb-2">✏️</div>
              <div className="text-lg">パーティを作成</div>
              <div className="text-xs opacity-90 mt-1">作成・編集</div>
            </button>

            <button
              onClick={() => router.push('/my-teams')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-3xl mb-2">💾</div>
              <div className="text-lg">マイパーティ</div>
              <div className="text-xs opacity-90 mt-1">保存済み</div>
            </button>

            <button
              onClick={() => {
                const url = prompt('相手から受け取ったURLを貼り付けてください');
                if (url) {
                  try {
                    const urlObj = new URL(url);
                    if (urlObj.pathname === '/view') {
                      router.push(url);
                    } else {
                      alert('正しいURLを入力してください');
                    }
                  } catch {
                    alert('正しいURLを入力してください');
                  }
                }
              }}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-6 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-3xl mb-2">👁️</div>
              <div className="text-lg">相手のパーティ</div>
              <div className="text-xs opacity-90 mt-1">URL入力</div>
            </button>
          </div>
        </div>

        {/* サンプルパーティ */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center">
              サンプルパーティ
            </h3>
            <p className="text-center text-white text-sm mt-1 opacity-90">
              このような形でパーティが表示されます
            </p>
          </div>

          {/* パーティリスト */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              {sampleTeam.pokemon.map((pokemon) => (
                <CompactPokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>

            {/* アクションボタン */}
            <div className="text-center">
              <button
                onClick={() => router.push('/builder')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                自分のパーティを作成する
              </button>
            </div>
          </div>
        </div>

        {/* 使い方 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">使い方</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">パーティ作成</h4>
              <p className="text-sm text-gray-600">
                ビルダーで自分のパーティを作成
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">URL共有</h4>
              <p className="text-sm text-gray-600">
                生成されたURLを対戦相手に送信
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">相手のパーティ確認</h4>
              <p className="text-sm text-gray-600">
                相手からもらったURLを開く
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">4</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">対戦開始</h4>
              <p className="text-sm text-gray-600">
                お互いのパーティを把握して対戦
              </p>
            </div>
          </div>
        </div>

        {/* 機能紹介 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">特徴</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl mb-3">📱</div>
              <h4 className="font-bold text-gray-800 mb-2">スマホ対応</h4>
              <p className="text-sm text-gray-600">
                スマートフォンでも見やすいレスポンシブデザイン
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-bold text-gray-800 mb-2">簡単操作</h4>
              <p className="text-sm text-gray-600">
                URLをコピー&ペーストするだけで即座に共有
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-xl">
              <div className="text-3xl mb-3">💎</div>
              <h4 className="font-bold text-gray-800 mb-2">第6世代対応</h4>
              <p className="text-sm text-gray-600">
                XY・ORAS世代のポケモン対戦に最適化
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>第6世代（XY/ORAS）オープンチームシート対戦ツール</p>
        </div>
      </div>
    </div>
  );
}
