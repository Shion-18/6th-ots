'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CompactPokemonCard from '@/components/ui/CompactPokemonCard';
import { sampleTeam } from '@/lib/sample-team';

// カメラ API はクライアント専用なので SSR を無効化して lazy-load
const QRScanner = dynamic(() => import('@/components/ui/QRScanner'), {
  ssr: false,
});

type OtherTeamMode = 'closed' | 'choose' | 'url' | 'qr';

export default function Home() {
  const router = useRouter();
  const [otherTeamMode, setOtherTeamMode] = useState<OtherTeamMode>('closed');
  const [inputUrl, setInputUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [scanError, setScanError] = useState('');

  const routeFromUrl = (rawUrl: string): boolean => {
    try {
      const urlObj = new URL(rawUrl.trim());
      // 旧: 自己完結エンコード /view?data=（後方互換で残す）
      if (urlObj.pathname === '/view') {
        const data = urlObj.searchParams.get('data');
        if (data) {
          router.push(`/view?data=${encodeURIComponent(data)}`);
          return true;
        }
      }
      // 新: 短縮URL /view/<shortId>（nanoid: A-Za-z0-9_-）
      const shortIdMatch = urlObj.pathname.match(/^\/view\/([A-Za-z0-9_-]+)$/);
      if (shortIdMatch) {
        router.push(`/view/${shortIdMatch[1]}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    if (!inputUrl.trim()) return;
    if (!routeFromUrl(inputUrl)) {
      setUrlError('正しいURLを入力してください');
    }
  };

  const handleQRScan = (decodedText: string) => {
    if (routeFromUrl(decodedText)) {
      setOtherTeamMode('closed');
      setScanError('');
    } else {
      setScanError('このQRコードは対応していません。共有URLを読み取ってください。');
      setOtherTeamMode('choose');
    }
  };

  const closeOtherTeam = () => {
    setOtherTeamMode('closed');
    setInputUrl('');
    setUrlError('');
    setScanError('');
  };

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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        {/* ヒーローセクション */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">
              パーティを共有して<br />対戦を始めよう
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
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
                setOtherTeamMode('choose');
                setUrlError('');
                setScanError('');
                setInputUrl('');
              }}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-6 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-3xl mb-2">👁️</div>
              <div className="text-lg">相手のパーティ</div>
              <div className="text-xs opacity-90 mt-1">QR / URL</div>
            </button>
          </div>

          {/* 相手のパーティ受信エリア */}
          {otherTeamMode === 'choose' && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  受け取り方法を選んでください
                </p>
                <button
                  onClick={closeOtherTeam}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              {scanError && (
                <p className="text-red-500 text-xs mb-3">{scanError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setOtherTeamMode('qr')}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-4 px-4 rounded-lg shadow transition-all"
                >
                  <div className="text-2xl mb-1">📷</div>
                  <div className="text-sm">QRコードをスキャン</div>
                </button>
                <button
                  onClick={() => {
                    setOtherTeamMode('url');
                    setUrlError('');
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-4 rounded-lg shadow transition-all"
                >
                  <div className="text-2xl mb-1">🔗</div>
                  <div className="text-sm">URLを入力</div>
                </button>
              </div>
            </div>
          )}

          {otherTeamMode === 'url' && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                相手から受け取ったURLを貼り付け
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => { setInputUrl(e.target.value); setUrlError(''); }}
                  placeholder="https://..."
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <button
                  onClick={handleUrlSubmit}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
                >
                  表示
                </button>
                <button
                  onClick={closeOtherTeam}
                  className="text-gray-400 hover:text-gray-600 px-2 text-lg"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              {urlError && (
                <p className="text-red-500 text-xs mt-2">{urlError}</p>
              )}
            </div>
          )}

          {otherTeamMode === 'qr' && (
            <QRScanner
              onScan={handleQRScan}
              onClose={() => setOtherTeamMode('choose')}
            />
          )}
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
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">使い方</h3>
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
              <h4 className="font-bold text-gray-800 mb-2">QR/URL共有</h4>
              <p className="text-sm text-gray-600">
                生成されたQRコードまたはURLを対戦相手に共有
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">相手のパーティ確認</h4>
              <p className="text-sm text-gray-600">
                QRをスキャンするかURLを開く
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

        {/* フッター */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>第6世代（XY/ORAS）オープンチームシート対戦ツール</p>
        </div>
      </div>
    </div>
  );
}
